import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Popover from '@mui/material/Popover';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import MenuList from '@mui/material/MenuList';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import { PdfFileCell } from 'src/components/utils/PdfFileCell';
import { useRouter } from 'src/routes/hooks';
import { caseSignPath, getListBasePath } from 'src/routes/case-paths';
import { formatDate } from './utils';

const avatarColors = ['#1A2942', '#1D8348', '#0369A1', '#B45309', '#7C3AED', '#BE123C'];

function initials(name?: string) {
  if (!name) return '؟';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
}

function avatarColor(seed?: string) {
  const text = String(seed || '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash + text.charCodeAt(i) * (i + 1)) % avatarColors.length;
  return avatarColors[hash];
}

function statusDot(isClosed?: boolean) {
  return isClosed ? '#94A3B8' : '#22C55E';
}

export function PartTableRow({ page, rowsPerPage, row, handleOpen, onDelete, index }: any) {
  const router = useRouter();
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const clientName = row.client?.full_name || '-';

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  return (
    <>
      <TableRow
        hover
        tabIndex={-1}
        sx={{
          '& td': { borderColor: 'grey.100', py: 1.5 },
          '&:hover': { bgcolor: 'rgba(26, 41, 66, 0.02)' },
        }}
      >
        <TableCell>
          <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 13 }}>
            {((Number(page) - 1) * Number(rowsPerPage || 1)) + index + 1}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              px: 1.25,
              py: 0.4,
              borderRadius: 999,
              bgcolor: '#E8EEF5',
              color: 'primary.main',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {row.client?.client_app_id || row.client?.client_number || '-'}
          </Box>
        </TableCell>
        <TableCell align="right">
          <Typography sx={{ fontWeight: 600, fontSize: 13 }}>
            {row.contract?.contract_number || '-'}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: 12,
                fontWeight: 800,
                bgcolor: avatarColor(clientName),
              }}
            >
              {initials(clientName)}
            </Avatar>
            <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{clientName}</Typography>
          </Box>
        </TableCell>
        <TableCell align="right">
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
            {row.contract?.branch_name || row.contract?.company_name || row.client?.company_name || '-'}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography sx={{ fontSize: 13, fontWeight: 600, direction: 'ltr', display: 'inline-block' }}>
            {row.client?.mobile || '-'}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{row.case_code || '-'}</Typography>
        </TableCell>
        <TableCell align="right">
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
            {row.case_number || '-'}/{row.case_year || '-'}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: statusDot(row.is_closed),
                flexShrink: 0,
              }}
            />
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{row.court_name || '-'}</Typography>
          </Box>
        </TableCell>
        <TableCell align="right">
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{row.case_type || '-'}</Typography>
        </TableCell>
        <TableCell align="right">
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              px: 1.1,
              py: 0.35,
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              bgcolor: row.is_closed ? 'grey.100' : '#E8F8EF',
              color: row.is_closed ? 'text.secondary' : '#1D8348',
            }}
          >
            {row.is_closed ? 'مغلق' : 'مفتوح'}
          </Box>
        </TableCell>
        <TableCell align="right">
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{formatDate(row.status_date)}</Typography>
        </TableCell>
        <TableCell align="right">
          <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>
            {row.created_by_name || row.created_by?.name || '-'}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <PdfFileCell path={row.gon7a_file_path} name={row.gon7a_file_name} />
        </TableCell>
        <TableCell align="right">
          <PdfFileCell path={row.mo3arda1_file_path} name={row.mo3arda1_file_name} />
        </TableCell>
        <TableCell align="right">
          <PdfFileCell path={row.est2naf_file_path} name={row.est2naf_file_name} />
        </TableCell>
        <TableCell align="right">
          <IconButton onClick={handleOpenPopover} size="small">
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuList
          disablePadding
          sx={{
            p: 0.5,
            gap: 0.5,
            width: 160,
            display: 'flex',
            flexDirection: 'column',
            [`& .${menuItemClasses.root}`]: {
              px: 1,
              gap: 2,
              borderRadius: 0.75,
            },
          }}
        >
          <MenuItem
            onClick={() => {
              handleClosePopover();
              handleOpen();
            }}
          >
            عرض / تعديل
            <Iconify icon="solar:pen-bold" />
          </MenuItem>
          {row.gon7a_file_path && (
            <MenuItem
              onClick={() => {
                handleClosePopover();
                router.push(caseSignPath(row.id), {
                  state: { returnTo: getListBasePath() },
                });
              }}
            >
              توقيع الملف
              <Iconify icon="solar:pen-new-round-bold" />
            </MenuItem>
          )}
          {onDelete && (
            <MenuItem
              onClick={() => {
                handleClosePopover();
                onDelete();
              }}
              sx={{ color: 'error.main' }}
            >
              حذف
              <Iconify icon="solar:trash-bin-trash-bold" />
            </MenuItem>
          )}
        </MenuList>
      </Popover>
    </>
  );
}
