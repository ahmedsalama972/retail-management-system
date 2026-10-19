import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { CheckOutlined, Close as CloseIcon } from '@mui/icons-material';
import type { Breakpoint, SxProps, Theme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';

export type AppDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  statusChip?: string;
  children: ReactNode;
  toolbar?: ReactNode;
  infoBanner?: string | null;
  maxWidth?: Breakpoint | false;
  paperSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  hideClose?: boolean;
  hideSecurityNote?: boolean;
  cancelLabel?: string;
  showCancel?: boolean;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  primaryEndIcon?: ReactNode;
  primaryColor?: 'primary' | 'error' | 'success' | 'inherit';
  primarySx?: SxProps<Theme>;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondarySx?: SxProps<Theme>;
  footerExtra?: ReactNode;
};

export function AppDialog({
  open,
  onClose,
  title,
  subtitle = 'إدخال البيانات المطلوبة وحفظها في النظام وفق الإجراءات المعتمدة',
  statusChip = 'قيد التسجيل',
  children,
  toolbar,
  infoBanner,
  maxWidth = 'sm',
  paperSx,
  contentSx,
  hideClose = false,
  hideSecurityNote = false,
  cancelLabel = 'إلغاء الأمر',
  showCancel = true,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  primaryEndIcon = <CheckOutlined />,
  primaryColor = 'primary',
  primarySx,
  secondaryLabel,
  onSecondary,
  secondarySx,
  footerExtra,
}: AppDialogProps) {
  const showFooter = Boolean(onPrimary || onSecondary || showCancel || footerExtra || !hideSecurityNote);

  return (
    <Dialog
      open={open}
      onClose={hideClose ? undefined : onClose}
      fullWidth
      maxWidth={maxWidth}
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          width: '96vw',
          boxShadow: '0 24px 64px rgba(15, 23, 42, 0.28)',
          ...((paperSx as object) || {}),
        },
      }}
    >
      <Box
        sx={{
          bgcolor: '#1A2942',
          color: '#fff',
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, minWidth: 0 }}>
          <Box
            component="img"
            src="/logo.png"
            alt="شعار النظام"
            sx={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              objectFit: 'contain',
              bgcolor: '#fff',
              p: 0.5,
              flexShrink: 0,
              boxShadow: '0 0 0 2px rgba(201,162,39,0.45)',
            }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 800, fontSize: 20, lineHeight: 1.2 }}>{title}</Typography>
              {statusChip ? (
                <Chip
                  label={statusChip}
                  size="small"
                  sx={{
                    height: 22,
                    bgcolor: 'rgba(201,162,39,0.2)',
                    color: '#F5E6A8',
                    fontWeight: 700,
                    fontSize: 11,
                    border: '1px solid rgba(201,162,39,0.45)',
                  }}
                />
              ) : null}
            </Box>
            {subtitle ? (
              <Typography sx={{ mt: 0.75, fontSize: 12.5, color: 'rgba(255,255,255,0.72)', fontWeight: 500 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        </Box>
        {!hideClose && (
          <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)', mt: -0.5 }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {toolbar ? (
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            bgcolor: '#F8FAFC',
            borderBottom: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          {toolbar}
        </Box>
      ) : null}

      <Box sx={{ px: 2.5, py: 2.25, maxHeight: 'min(62vh, 640px)', overflowY: 'auto', ...((contentSx as object) || {}) }}>
        {infoBanner ? (
          <Box
            sx={{
              mb: 2.25,
              px: 1.75,
              py: 1.35,
              borderRadius: 2,
              bgcolor: '#EAF3FB',
              border: '1px solid #C9DFF3',
              display: 'flex',
              gap: 1.25,
              alignItems: 'flex-start',
            }}
          >
            <Box
              sx={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                bgcolor: '#2F6FED',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                mt: 0.15,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              i
            </Box>
            <Typography sx={{ fontSize: 12.5, color: '#1E3A5F', fontWeight: 600, lineHeight: 1.7 }}>
              {infoBanner}
            </Typography>
          </Box>
        ) : null}
        {children}
      </Box>

      {showFooter ? (
        <Box
          sx={{
            px: 2.5,
            py: 1.75,
            borderTop: '1px solid',
            borderColor: 'grey.200',
            bgcolor: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          {!hideSecurityNote ? (
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
              <Iconify icon="solar:shield-check-bold" width={18} sx={{ color: '#1D8348' }} />
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
                بيانات مسجلة ومحمية وفق معايير الأمان القضائي المشددة
              </Typography>
            </Box>
          ) : (
            <Box />
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {footerExtra}
            {showCancel ? (
              <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 700 }}>
                {cancelLabel}
              </Button>
            ) : null}
            {secondaryLabel && onSecondary ? (
              <Button
                variant="outlined"
                onClick={onSecondary}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  borderColor: 'grey.300',
                  color: 'text.primary',
                  ...((secondarySx as object) || {}),
                }}
              >
                {secondaryLabel}
              </Button>
            ) : null}
            {primaryLabel && onPrimary ? (
              <Button
                variant="contained"
                color={primaryColor}
                disabled={primaryDisabled}
                onClick={onPrimary}
                endIcon={primaryEndIcon}
                sx={{
                  borderRadius: 2,
                  px: 2.5,
                  fontWeight: 800,
                  boxShadow:
                    primaryColor === 'error'
                      ? '0 8px 18px rgba(185,28,28,0.22)'
                      : '0 8px 18px rgba(26,41,66,0.22)',
                  ...((primarySx as object) || {}),
                }}
              >
                {primaryLabel}
              </Button>
            ) : null}
          </Box>
        </Box>
      ) : null}
    </Dialog>
  );
}

export default AppDialog;
