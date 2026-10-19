import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { Iconify } from 'src/components/iconify';
import { AppDialog } from 'src/components/utils/AppDialog';

type ConfirmDeleteDialogProps = {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteDialog({
  open,
  title = 'تأكيد الحذف',
  message = 'هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.',
  confirmLabel = 'حذف',
  cancelLabel = 'إلغاء الأمر',
  onClose,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={title}
      subtitle="يرجى التأكد قبل تنفيذ عملية الحذف النهائية"
      statusChip="إجراء حساس"
      maxWidth="xs"
      cancelLabel={cancelLabel}
      primaryLabel={confirmLabel}
      onPrimary={() => {
        onConfirm();
        onClose();
      }}
      primaryColor="error"
      primaryEndIcon={<Iconify icon="solar:trash-bin-trash-bold" width={18} />}
      infoBanner="ملاحظة: الحذف نهائي وقد يؤثر على السجلات المرتبطة بهذا البيان."
    >
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: '#FEE2E2',
            color: '#B91C1C',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" width={22} />
        </Box>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.secondary', lineHeight: 1.7, pt: 0.5 }}>
          {message}
        </Typography>
      </Box>
    </AppDialog>
  );
}
