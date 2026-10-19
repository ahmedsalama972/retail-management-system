import { Link as RouterLink, useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import TableContainer from '@mui/material/TableContainer';
import Button from '@mui/material/Button';

import { DashboardContent } from 'src/layouts/dashboard';
import { CircularLoader } from 'src/utils/CircularLoader';
import { Iconify } from 'src/components/iconify';
import { useGetClient } from 'src/hooks/customHooks';
import { PartsTableHead } from 'src/sections/legal-cases/parts-table-head';
import { formatDate } from 'src/sections/legal-cases/utils';
import { caseDetailsPath } from 'src/routes/case-paths';
import { useRouter } from 'src/routes/hooks';
import { useState } from 'react';

function InfoItem({ label, value }: { label: string; value?: any }) {
  return (
    <Grid item xs={12} sm={6} md={4}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>{label}</Typography>
      <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{value || '—'}</Typography>
    </Grid>
  );
}

export function ClientDetailsView() {
  const { id } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { data } = useGetClient({ key: 'GetClient_API', id, setIsLoading });
  const client = data?.data?.data;

  if (!client) {
    return (
      <DashboardContent>
        {isLoading && <CircularLoader />}
        <Typography sx={{ fontWeight: 700 }}>جاري تحميل بيانات العميل...</Typography>
      </DashboardContent>
    );
  }

  const cases = (client.contracts || []).flatMap((contract: any) =>
    (contract.cases || []).map((item: any) => ({
      ...item,
      contract_number: contract.contract_number,
      branch_name: contract.branch_name || contract.company_name,
    }))
  );

  return (
    <DashboardContent>
      {isLoading && <CircularLoader />}

      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/clients" underline="hover" color="inherit" sx={{ fontWeight: 700 }}>
          العملاء
        </Link>
        <Typography sx={{ fontWeight: 800, color: 'primary.main' }}>{client.full_name}</Typography>
      </Breadcrumbs>

      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
            {client.full_name}
          </Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', mt: 0.5 }}>
            {client.client_app_id || client.client_number} · {cases.length} جنحة مرتبطة
          </Typography>
        </Box>
        <Chip
          label={client.has_legal_cases ? 'لديه قضايا' : 'بدون قضايا'}
          sx={{
            fontWeight: 800,
            bgcolor: client.has_legal_cases ? '#E8F8EF' : 'grey.100',
            color: client.has_legal_cases ? '#1D8348' : 'text.secondary',
          }}
        />
      </Box>

      <Card sx={{ p: 2.5, mb: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Typography sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>بيانات العميل</Typography>
        <Grid container spacing={2}>
          <InfoItem label="الاسم" value={client.full_name} />
          <InfoItem label="الاسم بالإنجليزية" value={client.full_name_en} />
          <InfoItem label="الموبايل" value={client.mobile} />
          <InfoItem label="هاتف 1" value={client.phone_1} />
          <InfoItem label="الرقم القومي" value={client.national_id} />
          <InfoItem label="تاريخ الميلاد" value={formatDate(client.dob)} />
          <InfoItem label="جهة العمل" value={client.company_name} />
          <InfoItem label="مكتب العمل" value={client.work_office} />
          <InfoItem label="عنوان المنزل" value={client.home_address} />
          <InfoItem label="عنوان العمل" value={client.work_address} />
          <InfoItem label="تاريخ الإضافة" value={formatDate(client.created_at)} />
        </Grid>
      </Card>

      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'grey.200', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'grey.100' }}>
          <Typography sx={{ fontWeight: 800, color: 'primary.main' }}>الجنح المرتبطة</Typography>
        </Box>
        <TableContainer>
          <Table>
            <PartsTableHead
              headLabel={[
                { id: 'code', label: 'كود القضية' },
                { id: 'number', label: 'رقم / سنة' },
                { id: 'contract', label: 'رقم العقد' },
                { id: 'company', label: 'الفرع / الشركة' },
                { id: 'court', label: 'المحكمة' },
                { id: 'status', label: 'الحالة' },
                { id: 'actions', label: '' },
              ]}
            />
            <TableBody>
              {cases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography sx={{ py: 3, fontWeight: 600, color: 'text.secondary' }}>
                      لا توجد جنح مرتبطة بهذا العميل
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                cases.map((item: any) => (
                  <TableRow key={item.id} hover>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{item.case_code || '-'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      {item.case_number || '-'}/{item.case_year || '-'}
                    </TableCell>
                    <TableCell align="right">{item.contract_number || '-'}</TableCell>
                    <TableCell align="right">{item.branch_name || '-'}</TableCell>
                    <TableCell align="right">{item.court_name || '-'}</TableCell>
                    <TableCell align="right">
                      <Chip
                        size="small"
                        label={item.is_closed ? 'مغلق' : 'مفتوح'}
                        sx={{
                          fontWeight: 800,
                          bgcolor: item.is_closed ? 'grey.100' : '#E8F8EF',
                          color: item.is_closed ? 'text.secondary' : '#1D8348',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<Iconify icon="solar:eye-bold" width={16} />}
                        onClick={() => router.push(caseDetailsPath(item.id))}
                        sx={{ fontWeight: 800 }}
                      >
                        التفاصيل
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </DashboardContent>
  );
}
