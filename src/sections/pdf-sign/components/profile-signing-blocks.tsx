import { Box, Typography } from '@mui/material';

import { useLanguage } from 'src/contexts/language-context';

type ProfileSigningBlocksProps = {
  signaturePreview: string | null;
  placementMode: boolean;
  onEnableSignature: () => void;
};

export function ProfileSigningBlocks({
  signaturePreview,
  placementMode,
  onEnableSignature,
}: ProfileSigningBlocksProps) {
  const { t } = useLanguage();

  if (!signaturePreview) return null;

  return (
    <Box
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        bgcolor: '#F4F5F7',
        border: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography sx={{ fontWeight: 700, mb: 1.5, color: '#1B2A3A' }}>
        {t('signContract.profileSignature', 'توقيعك')}
      </Typography>
      <Box
        sx={{
          bgcolor: 'transparent',
          backgroundImage:
            'linear-gradient(45deg, #eee 25%, transparent 25%), linear-gradient(-45deg, #eee 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eee 75%), linear-gradient(-45deg, transparent 75%, #eee 75%)',
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
          borderRadius: 1.5,
          p: 2,
          display: 'grid',
          placeItems: 'center',
          minHeight: 100,
          mb: 1.5,
        }}
      >
        <Box
          component="img"
          src={signaturePreview}
          alt={t('signContract.profileSignature', 'توقيعك')}
          sx={{ maxWidth: 1, maxHeight: 80 }}
        />
      </Box>
      {!placementMode && (
        <button
          type="button"
          onClick={onEnableSignature}
          className="place-signature-button"
          style={{ width: '100%', marginTop: 'auto' }}
        >
          {t('signContract.placeSignature', 'ضع التوقيع على الملف')}
        </button>
      )}
    </Box>
  );
}
