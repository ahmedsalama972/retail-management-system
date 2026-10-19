/**
 * Resolve the API origin used by axios / file URLs.
 *
 * - Dev: always same-origin `/api` (Vite proxies to API_PROXY_TARGET) — avoids CORS.
 * - Prod empty `VITE_APP_ENDPOINT_URL` → same-origin `/api` (Vercel rewrites).
 * - Prod absolute URL → call that host directly.
 */
export function resolveApiBaseUrl(): string {
  // Never call a remote API origin from the Vite dev server — use the proxy.
  if (import.meta.env.DEV) {
    return '/api';
  }

  const configured = String(import.meta.env.VITE_APP_ENDPOINT_URL ?? '')
    .trim()
    .replace(/\/$/, '');

  if (!configured) {
    return '/api';
  }

  if (
    configured.startsWith('http://') &&
    !/localhost|127\.0\.0\.1/.test(configured)
  ) {
    throw new Error('VITE_APP_ENDPOINT_URL must use HTTPS in production');
  }

  return configured;
}

/** Origin for `/storage/...` assets (same host when using the /api proxy). */
export function resolveFilesBaseUrl(): string {
  const api = resolveApiBaseUrl();
  if (!api || api === '/api') return '';
  return api.replace(/\/api\/?$/, '');
}

export function isSocketEnabled(): boolean {
  const flag = String(import.meta.env.VITE_SOCKET_ENABLED ?? 'true').toLowerCase();
  return !['0', 'false', 'no', 'off'].includes(flag);
}
