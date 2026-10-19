import type { IconButtonProps } from '@mui/material/IconButton';
import type { ReactNode } from 'react';

import { useCallback, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Badge from '@mui/material/Badge';
import Divider from '@mui/material/Divider';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/config-global';
import { Iconify } from 'src/components/iconify';
import { useRouter } from 'src/routes/hooks';
import { useGetLookups, useLogoutMutation } from 'src/hooks/customHooks';

// ----------------------------------------------------------------------

type MenuItemConfig = {
  label: string;
  subtitle: string;
  href: string;
  icon: string;
  badge?: ReactNode;
};

export type AccountPopoverProps = IconButtonProps & {
  data?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
    info?: React.ReactNode;
  }[];
};

function rolePermissionLabel(type?: string) {
  const value = String(type || '').trim();
  if (value.includes('مدير')) return 'صلاحية مطلقة';
  if (value.includes('مشرف')) return 'صلاحية إشراف';
  if (value === 'شركة' || value.toLowerCase() === 'company') return 'حساب شركة — التوقيع الإلكتروني';
  if (value) return value;
  return 'صلاحية تشغيل';
}

function MenuRow({
  icon,
  title,
  subtitle,
  badge,
  onClick,
}: {
  icon: string;
  title: string;
  subtitle: string;
  badge?: ReactNode;
  onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        px: 1.75,
        py: 1.35,
        cursor: 'pointer',
        transition: 'background-color 120ms ease',
        '&:hover': { bgcolor: '#F8FAFC' },
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.5,
          bgcolor: '#F1F5F9',
          color: '#475569',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <Iconify icon={icon} width={18} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', lineHeight: 1.35 }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: 'text.secondary', mt: 0.2 }}>
          {subtitle}
        </Typography>
      </Box>

      {badge}
      <Iconify icon="eva:arrow-ios-back-fill" width={16} sx={{ color: 'text.disabled', flexShrink: 0 }} />
    </Box>
  );
}

export function AccountPopover({ data = [], sx, ...other }: AccountPopoverProps) {
  const router = useRouter();
  const user = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }, []);

  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: lookupsData } = useGetLookups({ key: 'GetLookups_API' });
  const lookupsCount = lookupsData?.data?.data?.length || 0;

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const { mutate: LogoutMutation } = useLogoutMutation({
    key: 'Logout_API',
    setOpen: () => {},
    setIsLoading,
  });

  const displayName = user?.name || 'مستخدم النظام';
  const email = user?.email || '—';
  const role = user?.type || 'موظف قانوني';
  const workType = user?.work_type || 'الشئون القانونية';
  const permission = rolePermissionLabel(role);
  const initial = String(displayName).trim().charAt(0) || 'م';

  const isCompany =
    String(user?.type || '').trim() === 'شركة' || String(user?.type || '').toLowerCase() === 'company';

  const menuItems: MenuItemConfig[] = [
    {
      label: 'الملف الشخصي والبيانات',
      subtitle: 'عرض بيانات الحساب والتوقيع الإلكتروني',
      href: '/profile',
      icon: 'solar:user-id-bold-duotone',
    },
    ...(!isCompany
      ? [
          {
            label: 'إعدادات بيانات النظام',
            subtitle: 'الجهات، المحاكم، الدوائر، والمستخدمين',
            href: '/settings',
            icon: 'solar:settings-bold-duotone',
            badge: (
              <Chip
                size="small"
                label={`${lookupsCount} بيان`}
                sx={{
                  height: 24,
                  fontWeight: 800,
                  fontSize: 11,
                  bgcolor: '#EEF2F7',
                  color: '#334155',
                  mr: 0.25,
                }}
              />
            ),
          },
          {
            label: 'الجنح',
            subtitle: 'متابعة ملفات الجنح المسجّلة',
            href: '/legal-cases',
            icon: 'solar:document-text-bold-duotone',
          },
          {
            label: 'الإنذارات',
            subtitle: 'عرض وإضافة الإنذارات المرتبطة',
            href: '/warnings',
            icon: 'solar:bell-bing-bold-duotone',
          },
        ]
      : []),
    ...data
      .filter((item) => !['/settings', '/profile', '/legal-cases', '/warnings'].includes(item.href))
      .map((item) => ({
        label: item.label,
        subtitle: 'انتقال سريع',
        href: item.href,
        icon: 'solar:widget-bold-duotone',
      })),
  ];

  const goTo = (href: string) => {
    handleClosePopover();
    router.push(href);
  };

  return (
    <>
      <Box
        onClick={handleOpenPopover}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          px: 1,
          py: 0.5,
          borderRadius: 999,
          cursor: 'pointer',
          bgcolor: 'grey.100',
          border: '1px solid',
          borderColor: 'grey.200',
          ...sx,
        }}
        {...(other as any)}
      >
        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: 'primary.main', lineHeight: 1.2 }}>
            {displayName}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>{role}</Typography>
        </Box>
        <IconButton sx={{ p: 0.25, width: 40, height: 40 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontWeight: 800, fontSize: 14 }}>
            {initial}
          </Avatar>
        </IconButton>
      </Box>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              width: 360,
              maxWidth: 'calc(100vw - 24px)',
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 18px 48px rgba(15, 23, 42, 0.16)',
              border: '1px solid',
              borderColor: 'grey.200',
            },
          },
        }}
      >
        <Box sx={{ p: 2, pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              badgeContent={
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    bgcolor: '#C9A227',
                    color: '#1A2942',
                    display: 'grid',
                    placeItems: 'center',
                    border: '2px solid #fff',
                  }}
                >
                  <Iconify icon="solar:shield-check-bold" width={11} />
                </Box>
              }
            >
              <Avatar
                sx={{
                  width: 52,
                  height: 52,
                  bgcolor: '#1A2942',
                  fontWeight: 800,
                  fontSize: 20,
                }}
              >
                {initial}
              </Avatar>
            </Badge>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 15.5, color: '#0F172A', lineHeight: 1.35 }}>
                  {displayName}
                </Typography>
                <Chip
                  size="small"
                  label={
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#22C55E' }} />
                      نشط
                    </Box>
                  }
                  sx={{
                    height: 24,
                    fontWeight: 800,
                    fontSize: 11,
                    bgcolor: '#ECFDF5',
                    color: '#15803D',
                    border: '1px solid #A7F3D0',
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mt: 0.6 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }} noWrap>
                  {email}
                </Typography>
                <Chip
                  size="small"
                  label={role}
                  sx={{
                    height: 22,
                    fontWeight: 800,
                    fontSize: 10.5,
                    bgcolor: '#FEF6E7',
                    color: '#A16207',
                    border: '1px solid #F6E2B3',
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.55, mt: 1.1 }}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                  <Iconify icon="solar:buildings-2-bold" width={14} sx={{ color: 'text.disabled' }} />
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary' }}>
                    {workType}
                  </Typography>
                </Box>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                  <Iconify icon="solar:key-bold" width={14} sx={{ color: 'text.disabled' }} />
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary' }}>
                    {permission}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              mt: 1.5,
              pt: 1.15,
              borderTop: '1px solid',
              borderColor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#22C55E' }} />
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary' }}>
                الجلسة نشطة ومؤمنة
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.disabled' }} dir="ltr">
              {CONFIG.appName}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'grey.100' }} />

        <Box sx={{ py: 0.5 }}>
          {menuItems.map((item, index) => (
            <Box key={`${item.href}-${item.label}`}>
              {index > 0 && <Divider sx={{ borderColor: 'grey.100', mx: 1.75 }} />}
              <MenuRow
                icon={item.icon}
                title={item.label}
                subtitle={item.subtitle}
                badge={item.badge}
                onClick={() => goTo(item.href)}
              />
            </Box>
          ))}
        </Box>

        <Divider sx={{ borderColor: 'grey.100' }} />

        <Box sx={{ p: 1.75 }}>
          <Button
            disabled={isLoading}
            fullWidth
            onClick={() => LogoutMutation(user)}
            startIcon={
              !isLoading ? <Iconify icon="solar:logout-2-bold" width={18} /> : undefined
            }
            sx={{
              borderRadius: 2,
              py: 1.1,
              fontWeight: 800,
              fontSize: 13.5,
              color: '#B91C1C',
              bgcolor: '#FEF2F2',
              border: '1px solid #FECACA',
              '&:hover': { bgcolor: '#FEE2E2', borderColor: '#FCA5A5' },
            }}
          >
            {!isLoading ? 'تسجيل الخروج من المنظومة' : <CircularProgress size={22} color="inherit" />}
          </Button>

          <Typography
            sx={{
              mt: 1.25,
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 600,
              color: 'text.disabled',
            }}
          >
            {CONFIG.appName} • الإصدار V{CONFIG.appVersion}
          </Typography>
        </Box>
      </Popover>
    </>
  );
}
