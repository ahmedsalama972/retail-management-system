import ReactDOM from 'react-dom/client';
import { Suspense, StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import { QueryClient, QueryClientProvider } from 'react-query';
import App from './app';
import { ThemeSwitcherProvider } from './contexts/themeSwitcher';

// ----------------------------------------------------------------------

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
      // Avoid remount/refocus storms; realtime invalidation handles freshness.
      refetchOnMount: false,
    },
  },
});

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <BrowserRouter>
          <Suspense>
            <ThemeSwitcherProvider>
              <App />
            </ThemeSwitcherProvider>
          </Suspense>
        </BrowserRouter>
      </HelmetProvider>
    </QueryClientProvider>
  </StrictMode>
);
