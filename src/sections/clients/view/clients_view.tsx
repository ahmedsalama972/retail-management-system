import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import { Toaster } from 'sonner';

import { DashboardContent } from 'src/layouts/dashboard';
import { CircularLoader } from 'src/utils/CircularLoader';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { useRouter } from 'src/routes/hooks';
import { useDeleteClientMutation, useGetClients, useGetCompanyAccounts } from 'src/hooks/customHooks';
import { PartsTableHead } from 'src/sections/legal-cases/parts-table-head';
import { PartTableToolbar } from 'src/sections/legal-cases/part-table-toolbar';
import { TableEmptyRows } from 'src/sections/legal-cases/table-empty-rows';
import { TableNoData } from 'src/sections/legal-cases/table-no-data';
import { emptyRows, formatDate } from 'src/sections/legal-cases/utils';
import { ConfirmDeleteDialog } from 'src/components/utils/ConfirmDeleteDialog';

export function ClientsView() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<any>(null);
  const arabicNumberFormat = new Intl.NumberFormat('ar-EG');

  const { data, refetch } = useGetClients({
    key: 'GetClients_API',
    page,
    search,
    filters: companyName ? { company_name: companyName } : {},
    setIsLoading,
  });
  const { data: companiesResponse } = useGetCompanyAccounts({ key: 'GetCompanyAccounts_API' });
  const { mutate: deleteClient } = useDeleteClientMutation({ setIsLoading, refetch });

  const rows = data?.data?.data || [];
  const companyOptions = (companiesResponse?.data?.data || []).map(
    (item: any) => item.name || item.company_name
  );
  const notFound = rows.length === 0;

  return (
    <DashboardContent>
      {isLoading && <CircularLoader />}
      <Toaster richColors expand={false} duration={5000} />

      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5 }}>
          العملاء
        </Typography>
        <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: 'text.secondary' }}>
          عرض بيانات العملاء المحفوظة عند إضافة الجنح، مع إمكانية التصفية والانتقال لتفاصيل كل عميل
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <PartTableToolbar
          filterName={search}
          placeholder="بحث بالاسم أو الموبايل أو الرقم القومي...."
          onFilterName={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
          companyOptions={companyOptions}
          selectedCompany={companyName}
          companyLabel="الفرع / الشركة"
          onCompanyChange={(company) => {
            setPage(1);
            setCompanyName(company);
          }}
        />
        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 900 }}>
              <PartsTableHead
                headLabel={[
                  { id: 'no', label: 'م' },
                  { id: 'name', label: 'اسم العميل' },
                  { id: 'mobile', label: 'الموبايل' },
                  { id: 'national', label: 'الرقم القومي' },
                  { id: 'company', label: 'الشركة / الفرع' },
                  { id: 'cases', label: 'الجنح' },
                  { id: 'date', label: 'تاريخ الإضافة' },
                  { id: 'actions', label: '' },
                ]}
              />
              <TableBody>
                {rows.map((row: any, index: number) => (
                  <TableRow key={row.id} hover sx={{ '& td': { borderColor: 'grey.100', py: 1.5 } }}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 13 }}>
                        {(page - 1) * (data?.data?.per_page || 10) + index + 1}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 700, fontSize: 13.5 }}>{row.full_name || '-'}</Typography>
                      <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 600 }}>
                        {row.client_app_id || row.client_number || ''}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontSize: 13, fontWeight: 600, direction: 'ltr', display: 'inline-block' }}>
                        {row.mobile || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{row.national_id || '-'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'flex-end' }}>
                        {(row.company_labels || []).length ? (
                          (row.company_labels as string[]).map((label) => (
                            <Chip key={label} size="small" label={label} sx={{ fontWeight: 700, height: 24 }} />
                          ))
                        ) : (
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{row.company_name || '-'}</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        size="small"
                        label={`${row.cases_count || 0} جنحة`}
                        sx={{ fontWeight: 800, height: 26, bgcolor: '#E8EEF5', color: 'primary.main' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                        {formatDate(row.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => router.push(`/clients/${row.id}`)}
                        >
                          <Iconify icon="solar:eye-bold" width={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setDeleteRow(row);
                            setDeleteOpen(true);
                          }}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                <TableEmptyRows
                  height={68}
                  emptyRows={emptyRows(page - 1, data?.data?.per_page || 10, rows.length)}
                />
                {notFound && <TableNoData searchQuery={search} />}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
        <TablePagination
          sx={{ float: 'left' }}
          dir="ltr"
          component="div"
          page={page - 1}
          count={data?.data?.total || 0}
          rowsPerPage={data?.data?.per_page || 10}
          onPageChange={(_, newPage) => setPage(newPage + 1)}
          rowsPerPageOptions={[]}
          labelDisplayedRows={({ from, to, count }) =>
            `عرض ${arabicNumberFormat.format(from)}–${arabicNumberFormat.format(to)} من ${
              count !== -1 ? arabicNumberFormat.format(count) : `أكثر من ${arabicNumberFormat.format(to)}`
            }`
          }
        />
      </Card>

      <ConfirmDeleteDialog
        open={deleteOpen}
        title="حذف العميل"
        message={`هل أنت متأكد من حذف العميل "${deleteRow?.full_name || ''}"؟ سيتم حذف العقود والجنح المرتبطة به.`}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteRow(null);
        }}
        onConfirm={() => {
          if (deleteRow?.id) deleteClient({ id: deleteRow.id });
          setDeleteOpen(false);
          setDeleteRow(null);
        }}
      />
    </DashboardContent>
  );
}
