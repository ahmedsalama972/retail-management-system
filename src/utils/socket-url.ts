/**
 * Shared-host proxies expose Socket.io under a path prefix (e.g. /server).
 * `io('https://host/server')` would treat `/server` as a namespace — wrong.
 * Parse prefix into Socket.io `path` instead (same as tawke3y-next).
 */
export function parseSocketUrl(raw: string): { origin: string; path: string } {
  const fallback = { origin: raw.replace(/\/$/, ''), path: '/socket.io' };
  try {
    const url = new URL(raw, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const origin = `${url.protocol}//${url.host}`;
    const prefix = url.pathname.replace(/\/$/, '');
    if (!prefix || prefix === '/') {
      return { origin, path: '/socket.io' };
    }
    return { origin, path: `${prefix}/socket.io` };
  } catch {
    return fallback;
  }
}

/**
 * Only the configured path. Do not fall back to host-root `/socket.io` —
 * that hits Laravel (404) after a 503 when Node is down and looks like a
 * second unrelated failure.
 */
export function socketConnectionCandidates(raw: string): { origin: string; path: string }[] {
  return [parseSocketUrl(raw)];
}
