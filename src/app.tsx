import 'src/global.css';

import { Toaster } from 'sonner';

import { Router } from 'src/routes/sections';

import { useScrollToTop } from 'src/hooks/use-scroll-to-top';

import { AuthProvider } from 'src/contexts/auth-context';
import { NotificationsSocketProvider } from 'src/contexts/notifications-socket-context';
import { ThemeProvider } from 'src/theme/theme-provider';

// ----------------------------------------------------------------------

export default function App() {
  useScrollToTop();

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationsSocketProvider>
          <Toaster richColors expand={false} duration={5000} position="top-center" style={{ zIndex: 20000 }} />
          <Router />
        </NotificationsSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
