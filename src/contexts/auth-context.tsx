import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';

import axios from 'axios';

import {
  clearAuthSession,
  getAuthToken,
  LOGIN_PATH,
  readStoredUser,
  setAuthSession,
  subscribeAuthChanged,
  syncAuthSession,
} from 'src/utils/auth-session';
import { resolveApiBaseUrl } from 'src/utils/api-base';
import type { StoredUser } from 'src/utils/user-role';
import { getHomePathForUser } from 'src/utils/user-role';

type AuthContextValue = {
  user: StoredUser | null;
  isAuthenticated: boolean;
  loginSuccess: (user: StoredUser, token: string) => void;
  logoutLocal: () => void;
  requireAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readAuthState() {
  const ok = syncAuthSession();
  return {
    user: ok ? readStoredUser() : null,
    isAuthenticated: ok,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState(readAuthState);

  const refresh = useCallback(() => {
    setState(readAuthState());
  }, []);

  const requireAuth = useCallback(() => {
    clearAuthSession();
    setState({ user: null, isAuthenticated: false });
    if (window.location.pathname !== LOGIN_PATH) {
      navigate(LOGIN_PATH, { replace: true });
    }
  }, [navigate]);

  const loginSuccess = useCallback(
    (user: StoredUser, token: string) => {
      setAuthSession(user, token);
      setState({ user, isAuthenticated: true });
      navigate(getHomePathForUser(user), { replace: true });
    },
    [navigate]
  );

  const logoutLocal = useCallback(() => {
    clearAuthSession();
    setState({ user: null, isAuthenticated: false });
    navigate(LOGIN_PATH, { replace: true });
  }, [navigate]);

  useEffect(() => subscribeAuthChanged(refresh), [refresh]);

  // Validate token against the API on load; expired/invalid sessions go to login.
  useEffect(() => {
    if (!state.isAuthenticated) return undefined;

    const token = getAuthToken();
    if (!token) {
      requireAuth();
      return undefined;
    }

    let cancelled = false;
    const base = resolveApiBaseUrl();

    axios
      .get(`${base}/me`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        withCredentials: true,
      })
      .then((res) => {
        if (cancelled) return;
        const nextUser = res?.data?.user;
        if (nextUser) {
          setAuthSession(nextUser, token);
          setState({ user: nextUser, isAuthenticated: true });
        }
      })
      .catch(() => {
        if (!cancelled) requireAuth();
      });

    return () => {
      cancelled = true;
    };
  }, [requireAuth, state.isAuthenticated]);

  const value = useMemo(
    () => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      loginSuccess,
      logoutLocal,
      requireAuth,
    }),
    [state.user, state.isAuthenticated, loginSuccess, logoutLocal, requireAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
