/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    VITE_APP_ENDPOINT_URL?: string;
    VITE_API_PROXY_TARGET?: string;
    API_PROXY_TARGET?: string;
    VITE_SITE_URL?: string;
    VITE_SOCKET_ENABLED?: string;
    VITE_SOCKET_URL?: string;
    VITE_SOCKET_PATH?: string;
  }
}
