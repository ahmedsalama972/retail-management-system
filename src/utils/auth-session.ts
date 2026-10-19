import type { StoredUser } from 'src/utils/user-role';

export const LOGIN_PATH = '/';

const AUTH_CHANGED_EVENT = 'retail-legal-auth-changed';

export function getAuthToken(): string | null {
  return localStorage.getItem('accessToken');
}

export function readStoredUser(): StoredUser | null {
  try {
    return JSON.parse(sessionStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

/** Authenticated only when both a token and a stored user profile exist. */
export function isSessionAuthenticated(): boolean {
  return Boolean(getAuthToken() && readStoredUser());
}

export function setAuthSession(user: StoredUser, token: string) {
  sessionStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('accessToken', token);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function clearAuthSession() {
  sessionStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  // Keep other session keys out of a logged-in state
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

/** Repair inconsistent storage (user without token, or token without user). */
export function syncAuthSession(): boolean {
  const token = getAuthToken();
  const user = readStoredUser();
  if (token && user) return true;
  if (token || user) {
    clearAuthSession();
  }
  return false;
}

export function subscribeAuthChanged(listener: () => void) {
  window.addEventListener(AUTH_CHANGED_EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}

export function isAuthPublicUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const path = url.startsWith('http') ? new URL(url).pathname : url.split('?')[0];
    return path === '/login' || path === '/register' || path.endsWith('/login') || path.endsWith('/register');
  } catch {
    return false;
  }
}
