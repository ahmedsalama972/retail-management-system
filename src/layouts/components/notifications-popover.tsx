import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';
import { useRouter } from 'src/routes/hooks';
import { useNotificationsSocket } from 'src/contexts/notifications-socket-context';
import {
  useGetNotifications,
  useGetNotificationsUnreadCount,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from 'src/hooks/customHooks';
import { getStoredUser, hasFeature, isCompanyUser } from 'src/utils/user-role';

type FilterId = 'all' | 'esign' | 'cases' | 'system';

type TypeMeta = {
  icon: string;
  tint: string;
  ink: string;
  category: FilterId;
  actionLabel?: string;
};

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'esign', label: 'مستندات وتوقيع' },
  { id: 'cases', label: 'جلسات وأحكام' },
  { id: 'system', label: 'تنبيهات النظام' },
];

function typeMeta(type?: string): TypeMeta {
  if (type?.startsWith('esign_')) {
    if (type === 'esign_received') {
      return {
        icon: 'solar:pen-bold',
        tint: 'rgba(37, 99, 235, 0.12)',
        ink: '#1D4ED8',
        category: 'esign',
        actionLabel: 'مراجعة وتوقيع',
      };
    }
    if (type === 'esign_signed' || type === 'esign_confirmed') {
      return {
        icon: 'solar:document-text-bold-duotone',
        tint: 'rgba(15, 118, 110, 0.12)',
        ink: '#0F766E',
        category: 'esign',
        actionLabel: 'معاينة المستند',
      };
    }
    if (type === 'esign_returned') {
      return {
        icon: 'solar:reply-bold',
        tint: 'rgba(180, 83, 9, 0.12)',
        ink: '#B45309',
        category: 'esign',
        actionLabel: 'مراجعة',
      };
    }
    return {
      icon: 'solar:document-add-bold-duotone',
      tint: 'rgba(37, 99, 235, 0.12)',
      ink: '#1D4ED8',
      category: 'esign',
      actionLabel: 'عرض',
    };
  }

  if (
    type?.startsWith('hearing_') ||
    type?.startsWith('case_') ||
    type?.startsWith('civil_') ||
    type?.startsWith('legal_') ||
    type?.includes('verdict') ||
    type?.includes('session')
  ) {
    return {
      icon: 'solar:clipboard-list-bold-duotone',
      tint: 'rgba(124, 58, 237, 0.12)',
      ink: '#6D28D9',
      category: 'cases',
      actionLabel: 'التفاصيل',
    };
  }

  if (type?.startsWith('team_')) {
    return {
      icon: 'solar:users-group-rounded-bold-duotone',
      tint: 'rgba(14, 116, 144, 0.12)',
      ink: '#0E7490',
      category: 'system',
      actionLabel: 'عرض',
    };
  }

  return {
    icon: 'solar:bell-bing-bold-duotone',
    tint: 'rgba(100, 116, 139, 0.14)',
    ink: '#475569',
    category: 'system',
    actionLabel: 'عرض',
  };
}

function formatRelative(iso?: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `منذ ${days} يوم`;

  return date.toLocaleString('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatClock(iso?: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });
}

/** Body already has the doc name as a tag — strip «...» duplicates from older notifications. */
function bodyWithoutDocName(body?: string | null, documentName?: string | null) {
  if (!body) return '';
  let text = body.replace(/«[^»]*»/g, '').replace(/\s{2,}/g, ' ').trim();
  if (documentName) {
    const escaped = documentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(escaped, 'g'), '').replace(/\s{2,}/g, ' ').trim();
  }
  return text.replace(/\s+([،,.])/g, '$1').replace(/\s{2,}/g, ' ').trim();
}

export function NotificationsPopover() {
  const router = useRouter();
  const user = getStoredUser();
  const { connected } = useNotificationsSocket();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [filter, setFilter] = useState<FilterId>('all');
  const open = Boolean(anchorEl);

  const { data: countRes, refetch: refetchCount } = useGetNotificationsUnreadCount();
  const { data: listRes, isLoading, refetch: refetchList } = useGetNotifications({
    key: 'GetNotifications_Popover',
    page: 1,
    enabled: open,
  });

  const refetchAll = () => {
    refetchCount();
    if (open) refetchList();
  };

  const { mutate: markRead } = useMarkNotificationReadMutation({ refetch: refetchAll });
  const { mutate: markAll, isLoading: markingAll } = useMarkAllNotificationsReadMutation({
    refetch: refetchAll,
  });

  const unread = Number(countRes?.data?.data?.unread || 0);
  const rows = useMemo(() => listRes?.data?.data || [], [listRes]);

  const filterCounts = useMemo(() => {
    const counts: Record<FilterId, number> = { all: 0, esign: 0, cases: 0, system: 0 };
    rows.forEach((item: any) => {
      const cat = typeMeta(item.type).category;
      counts.all += 1;
      counts[cat] += 1;
    });
    return counts;
  }, [rows]);

  const unreadByFilter = useMemo(() => {
    const counts: Record<FilterId, number> = { all: 0, esign: 0, cases: 0, system: 0 };
    rows.forEach((item: any) => {
      if (item.is_read) return;
      const cat = typeMeta(item.type).category;
      counts.all += 1;
      counts[cat] += 1;
    });
    return counts;
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (filter === 'all') return rows;
    return rows.filter((item: any) => typeMeta(item.type).category === filter);
  }, [rows, filter]);

  const viewAllPath = useMemo(() => {
    if (hasFeature(user, 'view_inbox') || isCompanyUser(user)) return '/esign/contracts';
    if (hasFeature(user, 'view_library')) return '/esign/library';
    return '/';
  }, [user]);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const resolveDocumentPath = (item: any): string | null => {
    const shareId = item?.data?.share_id ?? item?.data?.shareId;
    if (shareId && String(item?.type || '').startsWith('esign_')) {
      return `/esign/sign/${shareId}`;
    }
    const link = item?.data?.link;
    if (typeof link === 'string' && link) {
      // Older notifications pointed at list pages — prefer the document when share_id exists
      if (shareId && (link === '/esign/inbox' || link === '/esign/contracts' || link === '/esign/library')) {
        return `/esign/sign/${shareId}`;
      }
      return link;
    }
    return null;
  };

  const navigateFromItem = (item: any) => {
    if (!item.is_read) {
      markRead({ id: item.id });
    }
    handleClose();
    const path = resolveDocumentPath(item);
    if (path) {
      router.push(path);
    }
  };

  const arabicCount = (n: number) => new Intl.NumberFormat('ar-EG').format(n);

  return (
    <>
      <IconButton
        color="default"
        onClick={handleOpen}
        sx={{
          bgcolor: open ? 'rgba(26, 41, 66, 0.08)' : 'grey.100',
          '&:hover': { bgcolor: 'rgba(26, 41, 66, 0.1)' },
        }}
      >
        <Badge
          color="error"
          badgeContent={unread > 99 ? '99+' : unread}
          invisible={unread <= 0}
          overlap="circular"
        >
          <Iconify icon="solar:bell-bing-bold-duotone" width={22} />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              width: 420,
              maxWidth: 'calc(100vw - 20px)',
              borderRadius: 3,
              mt: 1.25,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'rgba(15, 23, 42, 0.06)',
              boxShadow: '0 18px 50px rgba(15, 23, 42, 0.14)',
              direction: 'rtl',
            },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2.25,
            pt: 2,
            pb: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            background:
              'linear-gradient(180deg, rgba(248,250,252,0.95) 0%, rgba(255,255,255,1) 100%)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 17, color: '#0F172A' }}>
              الإشعارات
            </Typography>
            {unread > 0 && (
              <Box
                sx={{
                  px: 1,
                  py: 0.2,
                  borderRadius: 999,
                  bgcolor: 'rgba(225, 29, 72, 0.1)',
                  color: '#BE123C',
                  fontSize: 11.5,
                  fontWeight: 800,
                  lineHeight: 1.6,
                }}
              >
                {arabicCount(unread)} جديدة
              </Box>
            )}
          </Box>

          {unread > 0 && (
            <Button
              size="small"
              onClick={() => markAll()}
              disabled={markingAll}
              startIcon={<Iconify icon="solar:check-circle-bold" width={16} />}
              sx={{
                fontWeight: 700,
                fontSize: 12,
                color: '#1A2942',
                px: 1,
                minWidth: 0,
                '& .MuiButton-startIcon': { mr: 0, ml: 0.75 },
              }}
            >
              تعليم الكل كمقروء
            </Button>
          )}

          <Tooltip title="الملف الشخصي">
            <IconButton
              size="small"
              onClick={() => {
                handleClose();
                router.push('/profile');
              }}
              sx={{ color: 'text.secondary' }}
            >
              <Iconify icon="solar:settings-bold" width={18} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Filters */}
        <Box
          sx={{
            px: 2,
            pb: 1.5,
            display: 'flex',
            gap: 0.75,
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {FILTERS.map((tab) => {
            const active = filter === tab.id;
            const count = filterCounts[tab.id];
            const hasUnread = unreadByFilter[tab.id] > 0;
            return (
              <Box
                key={tab.id}
                component="button"
                type="button"
                onClick={() => setFilter(tab.id)}
                sx={{
                  border: '1px solid',
                  borderColor: active ? '#1A2942' : 'rgba(15, 23, 42, 0.08)',
                  bgcolor: active ? '#1A2942' : '#F8FAFC',
                  color: active ? '#fff' : '#334155',
                  borderRadius: 999,
                  px: 1.35,
                  py: 0.55,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.6,
                  transition: 'all 0.15s ease',
                  fontFamily: 'inherit',
                  '&:hover': {
                    bgcolor: active ? '#152238' : '#F1F5F9',
                  },
                }}
              >
                {tab.label}
                {tab.id === 'all' && count > 0 ? ` (${arabicCount(count)})` : null}
                {tab.id !== 'all' && hasUnread && (
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      bgcolor: active ? '#FBBF24' : '#F59E0B',
                      flexShrink: 0,
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>

        <Divider sx={{ borderColor: 'rgba(15, 23, 42, 0.06)' }} />

        {/* List */}
        {isLoading ? (
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        ) : filteredRows.length === 0 ? (
          <Box sx={{ py: 6, px: 3, textAlign: 'center' }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 2.5,
                bgcolor: 'grey.100',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
              }}
            >
              <Iconify icon="solar:bell-bing-bold-duotone" width={26} sx={{ color: 'text.disabled' }} />
            </Box>
            <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 13.5 }}>
              لا توجد إشعارات في هذا التصنيف
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 440, overflowY: 'auto' }}>
            {filteredRows.map((item: any, index: number) => {
              const meta = typeMeta(item.type);
              const tag = item?.data?.document_name || item?.data?.case_number || item?.data?.tag;
              const bodyText = bodyWithoutDocName(item.body, item?.data?.document_name);
              const targetPath = resolveDocumentPath(item);
              const isDoc = Boolean(item?.data?.share_id || item?.data?.shareId);
              const unreadItem = !item.is_read;
              const clock = formatClock(item.created_at);
              const relative = formatRelative(item.created_at);

              return (
                <Box
                  key={item.id}
                  sx={{
                    position: 'relative',
                    px: 2.25,
                    py: 1.75,
                    borderBottom: '1px solid',
                    borderColor: 'rgba(15, 23, 42, 0.05)',
                    bgcolor: unreadItem
                      ? index === 0
                        ? 'rgba(37, 99, 235, 0.055)'
                        : 'rgba(37, 99, 235, 0.03)'
                      : 'transparent',
                    transition: 'background 0.15s ease',
                    '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.03)' },
                    ...(unreadItem
                      ? {
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 10,
                            bottom: 10,
                            right: 0,
                            width: 3,
                            borderRadius: '3px 0 0 3px',
                            bgcolor: '#2563EB',
                          },
                        }
                      : {}),
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1.35, alignItems: 'flex-start' }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1.75,
                        bgcolor: meta.tint,
                        color: meta.ink,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Iconify icon={meta.icon} width={22} />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1,
                          mb: 0.35,
                        }}
                      >
                        <Typography
                          sx={{
                            flex: 1,
                            fontWeight: unreadItem ? 800 : 700,
                            fontSize: 13.5,
                            color: '#0F172A',
                            lineHeight: 1.45,
                          }}
                        >
                          {item.title}
                        </Typography>
                        {unreadItem && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: '#2563EB',
                              mt: 0.7,
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </Box>

                      <Typography
                        sx={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 600, mb: 0.6 }}
                      >
                        {[clock, relative].filter(Boolean).join(' • ')}
                      </Typography>

                      {bodyText ? (
                        <Typography
                          sx={{
                            fontSize: 12.5,
                            color: '#475569',
                            fontWeight: 500,
                            lineHeight: 1.55,
                            mb: tag || meta.actionLabel ? 1 : 0,
                          }}
                        >
                          {bodyText}
                        </Typography>
                      ) : null}

                      {tag ? (
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            px: 1,
                            py: 0.25,
                            mb: 1,
                            borderRadius: 1,
                            bgcolor: 'rgba(180, 83, 9, 0.1)',
                            color: '#B45309',
                            fontSize: 11,
                            fontWeight: 700,
                            maxWidth: '100%',
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {tag}
                          </Box>
                        </Box>
                      ) : null}

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {meta.actionLabel && targetPath ? (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => navigateFromItem(item)}
                            sx={{
                              bgcolor: '#1A2942',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: 12,
                              borderRadius: 1.5,
                              px: 1.5,
                              py: 0.35,
                              boxShadow: 'none',
                              '&:hover': { bgcolor: '#152238', boxShadow: 'none' },
                            }}
                          >
                            {meta.actionLabel}
                          </Button>
                        ) : null}
                        <Button
                          size="small"
                          onClick={() => navigateFromItem(item)}
                          sx={{
                            fontWeight: 700,
                            fontSize: 12,
                            color: '#1D4ED8',
                            minWidth: 0,
                            px: 0.5,
                          }}
                        >
                          {targetPath ? (isDoc ? 'التفاصيل' : 'عرض') : 'تمت القراءة'}
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}

        <Divider sx={{ borderColor: 'rgba(15, 23, 42, 0.06)' }} />

        {/* Footer */}
        <Box
          sx={{
            px: 2,
            py: 1.35,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            bgcolor: '#F8FAFC',
          }}
        >
          <Button
            size="small"
            onClick={() => {
              handleClose();
              router.push(viewAllPath);
            }}
            endIcon={<Iconify icon="eva:arrow-ios-back-fill" width={16} />}
            sx={{
              fontWeight: 700,
              fontSize: 12,
              color: '#1A2942',
              px: 0.5,
              '& .MuiButton-endIcon': { mr: 0, ml: 0.5 },
            }}
          >
            عرض كل الإشعارات وسجل العمليات
          </Button>

          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, flexShrink: 0 }}>
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                bgcolor: connected ? '#16A34A' : '#94A3B8',
                boxShadow: connected ? '0 0 0 3px rgba(22,163,74,0.15)' : 'none',
              }}
            />
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>
              {connected ? 'محدث لحظياً' : 'غير متصل'}
            </Typography>
          </Box>
        </Box>
      </Popover>
    </>
  );
}
