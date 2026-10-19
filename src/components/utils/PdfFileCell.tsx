import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

import { Iconify } from 'src/components/iconify';
import { fileUrl } from 'src/sections/legal-cases/utils';

type PdfFileCellProps = {
  path?: string | null;
  name?: string | null;
};

function displayFileName(path?: string | null, name?: string | null) {
  if (name && String(name).trim()) return String(name).trim();
  if (!path) return '';
  const raw = String(path).split(/[/\\]/).pop() || String(path);
  return raw.length > 28 ? `${raw.slice(0, 24)}…` : raw;
}

export function PdfFileCell({ path, name }: PdfFileCellProps) {
  if (!path) {
    return (
      <Typography variant="body2" color="text.disabled" sx={{ fontWeight: 600 }}>
        -
      </Typography>
    );
  }

  const label = displayFileName(path, name);

  return (
    <Tooltip title={name || path}>
      <Box
        component="a"
        href={fileUrl(path)}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          maxWidth: 180,
          textDecoration: 'none',
          color: 'inherit',
          '&:hover .pdf-name': { color: 'primary.main' },
        }}
      >
        <Avatar
          variant="rounded"
          sx={{
            width: 34,
            height: 34,
            bgcolor: '#FEE2E2',
            color: '#B91C1C',
            borderRadius: 1.5,
            flexShrink: 0,
          }}
        >
          <Iconify icon="mdi:file-pdf-box" width={22} />
        </Avatar>
        <Typography
          className="pdf-name"
          sx={{
            fontSize: 12,
            fontWeight: 700,
            color: 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.35,
          }}
        >
          {label}
        </Typography>
      </Box>
    </Tooltip>
  );
}
