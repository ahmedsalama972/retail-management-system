import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from 'react-query';
import { toast } from 'sonner';

import {
  connectNotificationsSocket,
  disconnectNotificationsSocket,
  onActivityNotification,
  type ActivityNotificationPayload,
} from 'src/lib/socket';
import { useAuth } from 'src/contexts/auth-context';
import { playNotificationSound, unlockNotificationSound } from 'src/utils/notification-sound';

type NotificationsSocketContextValue = {
  connected: boolean;
  lastNotification: ActivityNotificationPayload | null;
};

const NotificationsSocketContext = createContext<NotificationsSocketContextValue>({
  connected: false,
  lastNotification: null,
});

export function NotificationsSocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<ActivityNotificationPayload | null>(
    null
  );

  const invalidateNotificationQueries = useCallback(() => {
    queryClient.invalidateQueries(['GetNotifications_API']);
    queryClient.invalidateQueries(['GetNotifications_Popover']);
    queryClient.invalidateQueries(['GetNotificationsUnreadCount_API']);
  }, [queryClient]);

  // Unlock audio after the first user gesture so notification chimes are not blocked.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const unlock = () => unlockNotificationSound();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectNotificationsSocket();
      setConnected(false);
      return undefined;
    }

    const s = connectNotificationsSocket();
    if (!s) return undefined;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    if (s.connected) setConnected(true);

    const unsubscribe = onActivityNotification((payload) => {
      setLastNotification(payload);
      invalidateNotificationQueries();
      playNotificationSound();
      if (payload?.title) {
        toast.info(payload.title, {
          description: payload.body || undefined,
          duration: 5000,
        });
      }
    });

    return () => {
      unsubscribe();
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      disconnectNotificationsSocket();
      setConnected(false);
    };
  }, [isAuthenticated, invalidateNotificationQueries]);

  const value = useMemo(
    () => ({ connected, lastNotification }),
    [connected, lastNotification]
  );

  return (
    <NotificationsSocketContext.Provider value={value}>
      {children}
    </NotificationsSocketContext.Provider>
  );
}

export function useNotificationsSocket() {
  return useContext(NotificationsSocketContext);
}
