import type { Theme, SxProps, Breakpoint } from '@mui/material/styles';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import { HelpOutline } from '@mui/icons-material';

import { Iconify } from 'src/components/iconify';

import { Main } from './main';
import { layoutClasses } from '../classes';
import { NavMobile, NavDesktop } from './nav';
import { getNavDataForUser } from '../config-nav-dashboard';
import { _workspaces } from '../config-nav-workspace';
import { MenuButton } from '../components/menu-button';
import { LayoutSection } from '../core/layout-section';
import { HeaderSection } from '../core/header-section';
import { AccountPopover } from '../components/account-popover';
import { NotificationsPopover } from '../components/notifications-popover';
import { getHomePathForUser, getStoredUser, isCompanyUser } from 'src/utils/user-role';

// ----------------------------------------------------------------------

export type DashboardLayoutProps = {
  sx?: SxProps<Theme>;
  children: React.ReactNode;
  header?: {
    sx?: SxProps<Theme>;
  };
};

export function DashboardLayout({ sx, children, header }: DashboardLayoutProps) {
  const theme = useTheme();
  const [navOpen, setNavOpen] = useState(false);
  const layoutQuery: Breakpoint = 'lg';
  const user = getStoredUser();
  const navData = useMemo(() => getNavDataForUser(user), [user?.type, user?.id]);
  const homePath = getHomePathForUser(user);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date()),
    []
  );

  return (
    <LayoutSection
      headerSection={
        <HeaderSection
          layoutQuery={layoutQuery}
          slotProps={{
            container: {
              maxWidth: false,
              sx: { px: { xs: 2, [layoutQuery]: 3 } },
            },
          }}
          sx={{
            bgcolor: 'rgba(255,255,255,0.92)',
            borderBottom: '1px solid',
            borderColor: 'grey.200',
            backdropFilter: 'blur(12px)',
            ...header?.sx,
          }}
          slots={{
            leftArea: (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <MenuButton
                  onClick={() => setNavOpen(true)}
                  sx={{
                    ml: -1,
                    [theme.breakpoints.up(layoutQuery)]: { display: 'none' },
                  }}
                />
                <NavMobile
                  data={navData}
                  open={navOpen}
                  onClose={() => setNavOpen(false)}
                  workspaces={_workspaces}
                />
                <Typography
                  sx={{
                    display: { xs: 'none', lg: 'block' },
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {todayLabel}
                </Typography>
                <IconButton color="default" sx={{ bgcolor: 'grey.100' }}>
                  <HelpOutline fontSize="small" />
                </IconButton>
                <NotificationsPopover />
              </Box>
            ),
            rightArea: (
              <AccountPopover
                data={[
                  {
                    label: 'الرئيسية',
                    href: homePath,
                    icon: <Iconify width={22} icon="solar:home-angle-bold-duotone" />,
                  },
                  {
                    label: 'الملف الشخصي والبيانات',
                    href: '/profile',
                    icon: <Iconify width={22} icon="solar:user-bold-duotone" />,
                  },
                  ...(!isCompanyUser(user)
                    ? [
                        {
                          label: 'الإعدادات',
                          href: '/settings',
                          icon: <Iconify width={22} icon="solar:settings-bold-duotone" />,
                        },
                      ]
                    : []),
                ]}
              />
            ),
          }}
        />
      }
      sidebarSection={<NavDesktop data={navData} layoutQuery={layoutQuery} workspaces={_workspaces} />}
      footerSection={null}
      cssVars={{
        '--layout-nav-vertical-width': '280px',
        '--layout-dashboard-content-pt': theme.spacing(2.5),
        '--layout-dashboard-content-pb': theme.spacing(5),
        '--layout-dashboard-content-px': theme.spacing(3),
      }}
      sx={{
        bgcolor: 'background.default',
        [`& .${layoutClasses.hasSidebar}`]: {
          [theme.breakpoints.up(layoutQuery)]: {
            pr: 'var(--layout-nav-vertical-width)',
          },
        },
        ...sx,
      }}
    >
      <Main>{children}</Main>
    </LayoutSection>
  );
}
