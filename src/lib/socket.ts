import { io, type Socket } from 'socket.io-client';

import { getAuthToken } from 'src/utils/auth-session';
import { isSocketEnabled } from 'src/utils/api-base';
import { parseSocketUrl } from 'src/utils/socket-url';

/**
 * Same cPanel Node app as tawke3y-next: Application URL = server
 * → https://tawke3y-eg.com/server/socket.io
 *
 * Do NOT create a second Node.js App (V8 cage OOM).
 */
function resolveSocketUrl(): string {
  const configured = String(import.meta.env.VITE_SOCKET_URL || '').trim().replace(/\/$/, '');
  if (configured) return configured;

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/server`;
  }

  return 'http://127.0.0.1:3001';
}

/** Shared hosting / Apache usually cannot upgrade websockets — prefer polling. */
function resolveTransports(): ('polling' | 'websocket')[] {
  const raw = String(import.meta.env.VITE_SOCKET_TRANSPORTS || '').trim().toLowerCase();
  if (raw) {
    const list = raw
      .split(',')
      .map((t) => t.trim())
      .filter((t): t is 'polling' | 'websocket' => t === 'polling' || t === 'websocket');
    if (list.length) return list;
  }

  const url = resolveSocketUrl();
  const isLocal =
    /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url) ||
    url.startsWith('http://127.') ||
    url.startsWith('http://localhost');

  return isLocal ? ['polling', 'websocket'] : ['polling'];
}

let socket: Socket | null = null;

export type ActivityNotificationPayload = {
  id: number;
  user_id?: number;
  actor_id?: number | null;
  type: string;
  title: string;
  body?: string | null;
  data?: Record<string, unknown> | null;
  read_at?: string | null;
  is_read?: boolean;
  created_at?: string | null;
};

export function getNotificationsSocket(): Socket | null {
  return socket;
}

export function connectNotificationsSocket(): Socket | null {
  if (!isSocketEnabled()) {
    disconnectNotificationsSocket();
    return null;
  }

  const token = getAuthToken();
  if (!token) {
    disconnectNotificationsSocket();
    return null;
  }

  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  const { origin, path } = parseSocketUrl(resolveSocketUrl());
  const transports = resolveTransports();

  socket = io(origin, {
    path,
    transports,
    upgrade: transports.includes('websocket'),
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 15000,
  });

  socket.on('connect_error', (err) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[socket] connect_error', err.message, { origin, path, transports });
    }
  });

  return socket;
}

export function disconnectNotificationsSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}

export function onActivityNotification(
  handler: (payload: ActivityNotificationPayload) => void
): () => void {
  const s = connectNotificationsSocket();
  if (!s) return () => undefined;

  const listener = (payload: ActivityNotificationPayload) => {
    handler(payload);
  };
  s.on('activity_notification', listener);
  return () => {
    s.off('activity_notification', listener);
  };
}
