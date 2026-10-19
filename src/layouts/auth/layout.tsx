import type { Theme, SxProps, Breakpoint } from '@mui/material/styles';

import { Main } from './main';
import { LayoutSection } from '../core/layout-section';

export type AuthLayoutProps = {
  sx?: SxProps<Theme>;
  children: React.ReactNode;
  header?: {
    sx?: SxProps<Theme>;
  };
};

export function AuthLayout({ sx, children }: AuthLayoutProps) {
  const layoutQuery: Breakpoint = 'md';

  return (
    <LayoutSection
      headerSection={null}
      footerSection={null}
      cssVars={{ '--layout-auth-content-width': '100%' }}
      sx={{
        bgcolor: '#E8EEF5',
        minHeight: '100vh',
        ...sx,
      }}
    >
      <Main layoutQuery={layoutQuery}>{children}</Main>
    </LayoutSection>
  );
}
