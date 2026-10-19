import type { Theme, SxProps, Breakpoint } from '@mui/material/styles';

import { useEffect } from 'react';

import Box from '@mui/material/Box';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import ListItemButton from '@mui/material/ListItemButton';
import Drawer, { drawerClasses } from '@mui/material/Drawer';

import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Logo } from 'src/components/logo';
import { Scrollbar } from 'src/components/scrollbar';

import type { NavGroup, NavItem } from '../config-nav-dashboard';
import type { WorkspacesPopoverProps } from '../components/workspaces-popover';

// ----------------------------------------------------------------------

export type NavContentProps = {
  data: NavGroup[] | NavItem[];
  slots?: {
    topArea?: React.ReactNode;
    bottomArea?: React.ReactNode;
  };
  workspaces: WorkspacesPopoverProps[ 'data' ];
  sx?: SxProps<Theme>;
};

function normalizeNavGroups(data: NavGroup[] | NavItem[]): NavGroup[] {
  if (!data?.length) return [];
  // Already grouped
  if ('subheader' in data[ 0 ] && 'items' in data[ 0 ]) {
    return data as NavGroup[];
  }
  // Legacy flat list
  return [ { subheader: 'القائمة', items: data as NavItem[] } ];
}

function NavLinkItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActived = pathname === item.path || pathname.startsWith(`${item.path}/`);

  return (
    <ListItem disableGutters disablePadding>
      <ListItemButton
        disableGutters
        component={RouterLink}
        href={item.path}
        sx={{
          px: 1.75,
          py: 1.15,
          gap: 1.5,
          borderRadius: 2,
          typography: 'body2',
          fontWeight: 600,
          color: 'var(--layout-nav-item-color)',
          minHeight: 'var(--layout-nav-item-height)',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: 'var(--layout-nav-item-hover-bg)',
          },
          ...(isActived && {
            fontWeight: 700,
            bgcolor: 'var(--layout-nav-item-active-bg)',
            color: 'var(--layout-nav-item-active-color)',
            boxShadow: '0 8px 20px rgba(26, 41, 66, 0.28)',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          }),
        }}
      >
        <Box
          component="span"
          sx={{
            width: 22,
            height: 22,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& svg': { fontSize: 20 },
          }}
        >
          {item.icon}
        </Box>

        <Box component="span" flexGrow={1} textAlign="right">
          {item.title}
        </Box>

        {item.info && item.info}
      </ListItemButton>
    </ListItem>
  );
}

export function NavDesktop({
  sx,
  data,
  slots,
  workspaces,
  layoutQuery,
}: NavContentProps & { layoutQuery: Breakpoint }) {
  const theme = useTheme();

  return (
    <Box
      className="layout-nav-desktop"
      sx={{
        pt: 2.5,
        px: 2,
        top: 0,
        right: 0,
        height: 1,
        display: 'none',
        position: 'fixed',
        flexDirection: 'column',
        bgcolor: 'var(--layout-nav-bg)',
        zIndex: 'var(--layout-nav-zIndex)',
        width: 'var(--layout-nav-vertical-width)',
        borderLeft: '1px solid var(--layout-nav-border-color)',
        boxShadow: '-4px 0 24px rgba(15, 23, 42, 0.04)',
        [ theme.breakpoints.up(layoutQuery) ]: {
          display: 'flex',
        },
        ...sx,
      }}
    >
      <NavContent data={data} slots={slots} workspaces={workspaces} />
    </Box>
  );
}

// ----------------------------------------------------------------------

export function NavMobile({
  sx,
  data,
  open,
  slots,
  onClose,
  workspaces,
}: NavContentProps & { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ pathname ]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      sx={{
        [ `& .${drawerClasses.paper}` ]: {
          pt: 2.5,
          px: 2,
          overflow: 'unset',
          bgcolor: 'var(--layout-nav-bg)',
          width: 'var(--layout-nav-mobile-width)',
          ...sx,
        },
      }}
    >
      <NavContent data={data} slots={slots} workspaces={workspaces} />
    </Drawer>
  );
}

// ----------------------------------------------------------------------

export function NavContent({ data, slots, workspaces, sx }: NavContentProps) {
  const groups = normalizeNavGroups(data);
  const flatPaths = groups.flatMap((group) => group.items.map((item) => item.path));
  const hasEsign = flatPaths.some((path) => String(path).startsWith('/esign'));
  const hasLegal = flatPaths.some(
    (path) =>
      path.startsWith('/legal-cases') ||
      path.startsWith('/pending-legal-issues') ||
      path.startsWith('/warnings') ||
      path.startsWith('/legal-issues') ||
      path === '/settings'
  );
  const brandTitle =
    hasEsign && hasLegal ? 'نظام الامتثال القانوني' : hasEsign ? 'حساب الشركة' : 'الاستشارات القانونية';
  const brandSubtitle =
    hasEsign && hasLegal
      ? 'التوقيع الإلكتروني والقضايا القانونية'
      : hasEsign
        ? 'مستندات التوقيع الإلكتروني'
        : 'نظام إدارة القضايا القانونية';
  const systemLabel =
    hasEsign && hasLegal ? 'الوحدات المتاحة' : hasEsign ? 'التوقيع الإلكتروني' : 'الاستشارات القانونية';

  return (
    <>
      <Box sx={{ px: 1, mb: 2.5, textAlign: 'center' }}>
        <Logo
          width={72}
          height={72}
          sx={{ mx: 'auto', mb: 1.5, display: 'flex', justifyContent: 'center' }}
        />
        <Typography sx={{ fontWeight: 800, fontSize: 14, color: 'primary.main', lineHeight: 1.4 }}>
          {brandTitle}
        </Typography>
        <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.5, lineHeight: 1.4 }}>
          {brandSubtitle}
        </Typography>
      </Box>

      <Box
        sx={{
          mx: 0.5,
          mb: 2.5,
          px: 1.5,
          py: 1.25,
          borderRadius: 2,
          bgcolor: '#E8EEF5',
          border: '1px solid',
          borderColor: 'grey.200',
        }}
      >
        <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 0.25 }}>النظام الحالي</Typography>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'primary.main', lineHeight: 1.4 }}>
          {systemLabel}
        </Typography>
      </Box>

      {slots?.topArea}

      <Scrollbar fillContent>
        <Box component="nav" display="flex" flex="1 1 auto" flexDirection="column" sx={sx}>
          <Box
            component="ul"
            gap={2}
            display="flex"
            flexDirection="column"
            sx={{ listStyle: 'none', m: 0, p: 0 }}
          >
            {groups.map((group) => (
              <Box component="li" key={group.subheader} sx={{ listStyle: 'none' }}>
                <Typography
                  sx={{
                    px: 1.5,
                    mb: 0.85,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.4,
                    color: 'text.disabled',
                    textTransform: 'none',
                  }}
                >
                  {group.subheader}
                </Typography>
                <Box
                  component="ul"
                  gap={0.65}
                  display="flex"
                  flexDirection="column"
                  sx={{ listStyle: 'none', m: 0, p: 0 }}
                >
                  {group.items.map((item) => (
                    <NavLinkItem key={`${group.subheader}-${item.path}`} item={item} />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Scrollbar>

      {slots?.bottomArea}

      <Box
        sx={{
          mt: 1,
          mb: 2,
          mx: 0.5,
          px: 1.5,
          py: 1.25,
          borderRadius: 2,
          bgcolor: '#E8EEF5',
          textAlign: 'center',
        }}
      >
        <Typography sx={{ fontSize: 10, color: 'text.secondary', mb: 0.25 }}>الرقم القضائي الموحد</Typography>
        <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'primary.main', letterSpacing: 0.4 }}>
          EGY-PP-2024-8841
        </Typography>
      </Box>
    </>
  );
}
