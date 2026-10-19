import { useCallback, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import { CheckOutlined } from '@mui/icons-material';
import { Toaster } from 'sonner';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { DashboardContent } from 'src/layouts/dashboard';
import { CircularLoader } from 'src/utils/CircularLoader';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import TextInputComponent from 'src/components/utils/TextInputComponent';
import AutocompleteComponent from 'src/components/utils/AutoCompleteComponent';
import ModalContainer from 'src/components/utils/ModalContainer';
import { PDFUpload } from 'src/components/file-upload/pdf-upload';
import { PdfFileCell } from 'src/components/utils/PdfFileCell';
import {
  useAddWarningMutation,
  useGetAllWarnings,
  useGetLookups,
  useGetWarningCompanies,
  useGetWarnings,
} from 'src/hooks/customHooks';
import { PartsTableHead } from 'src/sections/legal-cases/parts-table-head';
import { PartTableToolbar } from 'src/sections/legal-cases/part-table-toolbar';
import { TableEmptyRows } from 'src/sections/legal-cases/table-empty-rows';
import { TableNoData } from 'src/sections/legal-cases/table-no-data';
import { emptyRows, formatDate, getCompanyName } from 'src/sections/legal-cases/utils';

const warningTargets = [
  { id: 'client', name: 'على العميل' },
  { id: 'contract', name: 'على العقد' },
];

const noticeStatusOptions = [
  { id: 'معلن', name: 'معلن' },
  { id: 'إجابة', name: 'إجابة' },
];

const lookupName = (value: any) => (typeof value === 'object' && value ? value.name || '' : value || '');

export function WarningsView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [payload, setPayload] = useState({
    client_id: '',
    contract_id: '',
    target: 'client',
    warning_date: '',
    bailiffs: '',
    court_name: '',
    notice_status: '',
    notes: '',
    file: null as File | null,
  });
  const arabicNumberFormat = new Intl.NumberFormat('ar-EG');

  const filters = { company_name: companyName };
  const { data, refetch } = useGetWarnings({ key: 'GetWarnings_API', page, search, filters, setIsLoading });
  const { data: companiesResponse } = useGetWarningCompanies({
    key: 'GetWarningCompanies_API',
    search,
  });
  const { data: lookupsResponse } = useGetLookups({ key: 'GetLookups_API_Warnings' });
  const { refetch: refetchAll } = useGetAllWarnings({ key: 'GetAllWarnings_API', filters, setIsLoading });
  const { mutate: addWarning } = useAddWarningMutation({ setOpen: setOpenModal, setIsLoading, refetch });

  const rows = data?.data?.data || [];
  const companyOptions: string[] = companiesResponse?.data?.data || [];
  const lookups = lookupsResponse?.data?.data || [];
  const courtOptions = useMemo(() => lookups.filter((item: any) => item.type === 'court'), [lookups]);
  const notFound = rows.length === 0;

  const handleSubmit = () => {
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value) form.append(key, value as any);
    });
    addWarning(form);
  };

  const exportToExcel = async () => {
    setIsLoading(true);
    try {
      const result = await refetchAll();
      const dataarray = result?.data?.data?.data || result?.data?.data || [];
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('الإنذارات');
      worksheet.addRow(['م', 'العميل', 'الشركة', 'رقم العقد', 'النوع', 'التاريخ', 'المحضرين', 'المحكمة', 'معلن أو إجابة', 'ملاحظات']);
      dataarray.forEach((item: any, index: number) => {
        worksheet.addRow([
          index + 1,
          item.client?.full_name || item.contract?.client?.full_name,
          getCompanyName(item),
          item.contract?.contract_number,
          item.target === 'contract' ? 'على العقد' : 'على العميل',
          formatDate(item.warning_date),
          item.bailiffs,
          item.court_name,
          item.notice_status,
          item.notes,
        ]);
      });
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'الإنذارات.xlsx');
    } finally {
      setIsLoading(false);
    }
  };

  const onChangePage = useCallback((newPage: number) => setPage(newPage), []);

  return (
    <DashboardContent>
      {isLoading && <CircularLoader />}
      <Toaster richColors expand={false} duration={5000} />
      <Box display="flex" alignItems="center" mb={2.5} sx={{ justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
          إنذارات
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setOpenModal(true)}
            sx={{ borderRadius: 2, px: 2.5, fontWeight: 700 }}
          >
            إضافة إنذار
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<Iconify icon="mingcute:upload-line" />}
            onClick={exportToExcel}
            sx={{ borderRadius: 2, px: 2.5, fontWeight: 700 }}
          >
            تصدير إلى إكسل
          </Button>
        </Box>
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)', border: '1px solid', borderColor: 'grey.200' }}>
        <PartTableToolbar
          filterName={search}
          placeholder="بحث الإنذارات...."
          onFilterName={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          companyOptions={companyOptions}
          selectedCompany={companyName}
          companyLabel="الشركة"
          onCompanyChange={(company) => {
            setCompanyName(company);
            setPage(1);
          }}
          activeFilterCount={companyName ? 1 : 0}
        />
        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <PartsTableHead headLabel={[
                { id: 'no', label: 'م' },
                { id: 'client', label: 'العميل' },
                { id: 'company', label: 'الشركة' },
                { id: 'contract', label: 'رقم العقد' },
                { id: 'target', label: 'النوع' },
                { id: 'date', label: 'التاريخ' },
                { id: 'bailiffs', label: 'المحضرين' },
                { id: 'court', label: 'المحكمة' },
                { id: 'notice', label: 'معلن أو إجابة' },
                { id: 'notes', label: 'ملاحظات' },
                { id: 'file', label: 'المرفق' },
              ]} />
              <TableBody>
                {rows.map((row: any, index: number) => (
                  <TableRow hover key={row.id}>
                    <TableCell>{((page - 1) * (data?.data?.per_page || 10)) + index + 1}</TableCell>
                    <TableCell align="right">{row.client?.full_name || row.contract?.client?.full_name}</TableCell>
                    <TableCell align="right">{getCompanyName(row) || '-'}</TableCell>
                    <TableCell align="right">{row.contract?.contract_number}</TableCell>
                    <TableCell align="right">{row.target === 'contract' ? 'إنذار على العقد' : 'إنذار على العميل'}</TableCell>
                    <TableCell align="right">{formatDate(row.warning_date)}</TableCell>
                    <TableCell align="right">{row.bailiffs || '-'}</TableCell>
                    <TableCell align="right">{row.court_name || '-'}</TableCell>
                    <TableCell align="right">{row.notice_status || '-'}</TableCell>
                    <TableCell align="right">{row.notes}</TableCell>
                    <TableCell align="right">
                      <PdfFileCell path={row.file_path} name={row.file_name || row.file_path} />
                    </TableCell>
                  </TableRow>
                ))}
                <TableEmptyRows height={68} emptyRows={emptyRows(page, 0, rows.length)} />
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
          onPageChange={(_, newPage) => onChangePage(newPage + 1)}
          rowsPerPageOptions={[]}
          labelDisplayedRows={({ from, to, count }) =>
            `عرض ${arabicNumberFormat.format(from)}–${arabicNumberFormat.format(to)} من ${count !== -1 ? arabicNumberFormat.format(count) : `أكثر من ${arabicNumberFormat.format(to)}`}`
          }
        />
      </Card>

      <ModalContainer
        modalState={openModal}
        modalChangeState={() => setOpenModal(false)}
        modalTitle="إضافة إنذار"
        modalSubtitle="تسجيل إنذار على العميل أو العقد مع المرفق"
        infoBanner="يرجى التأكد من رقم العميل والعقد وتاريخ الإنذار قبل التسجيل."
        btnTitle="تسجيل"
        endIcon={<CheckOutlined />}
        modalAction={handleSubmit}
      >
        <TextInputComponent name="رقم العميل" type="number" value={payload.client_id} refState={(e: any) => setPayload((p) => ({ ...p, client_id: e.target.value }))} />
        <TextInputComponent name="رقم العقد" type="number" value={payload.contract_id} refState={(e: any) => setPayload((p) => ({ ...p, contract_id: e.target.value }))} />
        <AutocompleteComponent
          name="النوع"
          value={warningTargets.find((item) => item.id === payload.target) || warningTargets[0]}
          refState={(e: any) => setPayload((p) => ({ ...p, target: e?.id || e }))}
          data={warningTargets}
        />
        <TextInputComponent name="تاريخ الإنذار" type="date" isDatePicker value={payload.warning_date} refState={(e: any) => setPayload((p) => ({ ...p, warning_date: e.target.value }))} />
        <TextInputComponent
          name="المحضرين"
          type="text"
          value={payload.bailiffs}
          refState={(e: any) => setPayload((p) => ({ ...p, bailiffs: e.target.value }))}
        />
        <AutocompleteComponent
          name="المحكمة"
          value={courtOptions.find((item: any) => item.name === payload.court_name) || null}
          refState={(e: any) => setPayload((p) => ({ ...p, court_name: lookupName(e) }))}
          data={courtOptions}
        />
        <AutocompleteComponent
          name="معلن أو إجابة"
          value={noticeStatusOptions.find((item) => item.id === payload.notice_status) || null}
          refState={(e: any) => setPayload((p) => ({ ...p, notice_status: e?.id || lookupName(e) }))}
          data={noticeStatusOptions}
        />
        <TextInputComponent name="ملاحظات" type="text" value={payload.notes} refState={(e: any) => setPayload((p) => ({ ...p, notes: e.target.value }))} />
        <PDFUpload onFileSelect={(file) => setPayload((p) => ({ ...p, file }))} />
      </ModalContainer>
    </DashboardContent>
  );
}
