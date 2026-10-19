/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENDPOINT_URL?: string;
  readonly VITE_API_PROXY_TARGET?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_SOCKET_ENABLED?: string;
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_SOCKET_PATH?: string;
  readonly VITE_SOCKET_TRANSPORTS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
