import { useMemo, useState } from 'react';

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
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import { Toaster } from 'sonner';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { DashboardContent } from 'src/layouts/dashboard';
import { CircularLoader } from 'src/utils/CircularLoader';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import TextInputComponent from 'src/components/utils/TextInputComponent';
import AutocompleteComponent from 'src/components/utils/AutoCompleteComponent';
import { useRouter } from 'src/routes/hooks';
import {
  useAddCivilCaseMutation,
  useDeleteCivilCaseMutation,
  useGetAllCivilCases,
  useGetCivilCases,
  useGetCompanyAccounts,
  useGetLookups,
} from 'src/hooks/customHooks';
import { PartsTableHead } from 'src/sections/legal-cases/parts-table-head';
import { PartTableToolbar } from 'src/sections/legal-cases/part-table-toolbar';
import { TableEmptyRows } from 'src/sections/legal-cases/table-empty-rows';
import { TableNoData } from 'src/sections/legal-cases/table-no-data';
import { emptyRows, formatDate } from 'src/sections/legal-cases/utils';
import { SENTENCE_OPTIONS } from 'src/sections/legal-cases/sentence-options';
import { ConfirmDeleteDialog } from 'src/components/utils/ConfirmDeleteDialog';
import { PdfFileCell } from 'src/components/utils/PdfFileCell';
import { AddCivilCaseDialog } from '../add-civil-case-dialog';
import { emptyCivilPayload, PARTY_TYPES, type CivilCasePayload } from '../civil-types';

const lookupName = (value: any) => (typeof value === 'object' && value ? value.name || '' : value || '');

function buildSubmitForm(payload: CivilCasePayload) {
  const judgmentName =
    typeof payload.judgment === 'object' && payload.judgment ? payload.judgment.name : payload.judgment;
  const appealJudgmentName =
    typeof payload.appeal_judgment === 'object' && payload.appeal_judgment
      ? payload.appeal_judgment.name
      : payload.appeal_judgment;

  const partyType = payload.party_type?.id || 'company';
  const companyName = payload.company_name || payload.party?.name || '';
  const clientId = payload.client_id || payload.party?.id || '';

  const form = new FormData();
  form.append('party_type', partyType);
  form.append('company_name', String(companyName));
  form.append('client_id', String(clientId));
  form.append('filing_date', String(payload.filing_date || ''));
  form.append('court_name', String(payload.court_name || ''));
  form.append('case_number', String(payload.case_number || ''));
  form.append('case_year', String(payload.case_year || ''));
  form.append('circuit', String(payload.circuit || ''));
  form.append('judgment', String(judgmentName || ''));
  form.append('notes', String(payload.notes || ''));
  form.append('hearings', JSON.stringify(payload.hearings || []));
  form.append('appeal_hearings', JSON.stringify(payload.appeal_hearings || []));

  const hasAppeal = Boolean(
    payload.appeal_date ||
      payload.appeal_court_name ||
      payload.appeal_number ||
      payload.appeal_year ||
      payload.appeal_circuit ||
      appealJudgmentName ||
      payload.appeal_notes ||
      (payload.appeal_hearings || []).length
  );

  if (hasAppeal) {
    form.append('appeal_party_type', partyType);
    form.append('appeal_company_name', String(companyName));
    form.append('appeal_client_id', String(clientId));
    if (payload.appeal_date) form.append('appeal_date', String(payload.appeal_date));
    if (payload.appeal_court_name) form.append('appeal_court_name', String(payload.appeal_court_name));
    if (payload.appeal_number) form.append('appeal_number', String(payload.appeal_number));
    if (payload.appeal_year) form.append('appeal_year', String(payload.appeal_year));
    if (payload.appeal_circuit) form.append('appeal_circuit', String(payload.appeal_circuit));
    if (appealJudgmentName) form.append('appeal_judgment', String(appealJudgmentName));
    if (payload.appeal_notes) form.append('appeal_notes', String(payload.appeal_notes));
  }

  if (payload.document instanceof File) {
    form.append('document', payload.document);
  }
  return form;
}

export function CivilCasesView() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    party_type: '',
    company_name: '',
    client_name: '',
    filing_date: '',
    court_name: '',
    case_number: '',
    case_year: '',
    circuit: '',
    judgment: '',
  });
  const [payload, setPayload] = useState(emptyCivilPayload());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<any>(null);
  const arabicNumberFormat = new Intl.NumberFormat('ar-EG');

  const updateFilter = (key: string, value: any) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const queryFilters = {
    party_type: filters.party_type,
    company_name: filters.company_name,
    client_name: filters.client_name,
    filing_date: filters.filing_date,
    court_name: filters.court_name,
    case_number: filters.case_number,
    case_year: filters.case_year,
    circuit: filters.circuit,
    judgment: filters.judgment,
  };

  const { data, refetch } = useGetCivilCases({
    key: 'GetCivilCases_API',
    page,
    search,
    filters: queryFilters,
    setIsLoading,
  });
  const { refetch: refetchAll } = useGetAllCivilCases({
    key: 'GetAllCivilCases_API',
    search,
    filters: queryFilters,
    setIsLoading,
  });
  const { data: companiesRes } = useGetCompanyAccounts({ key: 'GetCompanyAccounts_CivilFilters' });
  const { data: lookupsRes } = useGetLookups({ key: 'GetLookups_CivilFilters' });
  const { mutate: addCase } = useAddCivilCaseMutation({
    setOpen: setOpenModal,
    setIsLoading,
    refetch,
  });
  const { mutate: deleteCase } = useDeleteCivilCaseMutation({ setIsLoading, refetch });

  const rows = data?.data?.data || [];
  const companies = companiesRes?.data?.data || [];
  const lookups = lookupsRes?.data?.data || [];
  const courtOptions = useMemo(() => lookups.filter((i: any) => i.type === 'court'), [lookups]);
  const circuitOptions = useMemo(() => lookups.filter((i: any) => i.type === 'circuit'), [lookups]);
  const notFound = rows.length === 0;
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const selectedPartyType = PARTY_TYPES.find((item) => item.id === filters.party_type) || null;
  const isCompanyParty = filters.party_type === 'company';

  const exportToExcel = async () => {
    setIsLoading(true);
    try {
      const result = await refetchAll();
      const dataarray = result?.data?.data?.data || result?.data?.data || [];
      if (!Array.isArray(dataarray)) return;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('المدني');
      const headers = [
        'م',
        'الطرف',
        'نوع الطرف',
        'كود القضية',
        'رقم الدعوى',
        'سنة الدعوى',
        'المحكمة',
        'الدائرة',
        'تاريخ إقامة الدعوى',
        'الحكم',
        'ملاحظات',
        'أضيف بواسطة',
        'طرف الاستئناف',
        'رقم الاستئناف',
        'سنة الاستئناف',
        'محكمة الاستئناف',
        'دائرة الاستئناف',
        'حكم الاستئناف',
      ];
      worksheet.addRow(headers);
      dataarray.forEach((item: any, index: number) => {
        worksheet.addRow([
          index + 1,
          item.party_label || '',
          item.party_type === 'company' ? 'شركة' : 'عميل',
          item.case_code || '',
          item.case_number || '',
          item.case_year || '',
          item.court_name || '',
          item.circuit || '',
          formatDate(item.filing_date) || '',
          item.judgment || '',
          item.notes || '',
          item.created_by_name || item.created_by?.name || '',
          item.appeal?.party_label || '',
          item.appeal?.appeal_number || '',
          item.appeal?.appeal_year || '',
          item.appeal?.court_name || '',
          item.appeal?.circuit || '',
          item.appeal?.judgment || '',
        ]);
      });
      worksheet.getRow(1).font = { bold: true };
      worksheet.columns = headers.map(() => ({ width: 22 }));
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        'المدني.xlsx'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardContent>
      {isLoading && <CircularLoader />}
      <Toaster richColors expand={false} duration={5000} style={{ zIndex: 20000 }} position="top-center" />

      <Box
        sx={{
          mb: 2.5,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5 }}>
            المدني
          </Typography>
          <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: 'text.secondary' }}>
            إدارة الدعاوى المدنية وجلساتها والتقارير بالاستئناف
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => {
              setPayload(emptyCivilPayload());
              setOpenModal(true);
            }}
            sx={{ fontWeight: 800, borderRadius: 2 }}
          >
            إضافة دعوى مدنية
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<Iconify icon="mingcute:upload-line" />}
            onClick={exportToExcel}
            sx={{ fontWeight: 800, borderRadius: 2 }}
          >
            تصدير إلى إكسل
          </Button>
        </Box>
      </Box>

      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <PartTableToolbar
          filterName={search}
          placeholder="بحث برقم الدعوى أو المحكمة أو الطرف...."
          onFilterName={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
          filterOpen={filtersOpen}
          onToggleFilter={() => setFiltersOpen((open) => !open)}
          activeFilterCount={activeFilterCount}
          filterContent={
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <AutocompleteComponent
                  name="اختار من"
                  value={selectedPartyType}
                  refState={(e: any) => {
                    setPage(1);
                    setFilters((prev) => ({
                      ...prev,
                      party_type: e?.id || '',
                      company_name: e?.id === 'company' ? prev.company_name : '',
                      client_name: e?.id === 'client' ? prev.client_name : '',
                    }));
                  }}
                  data={PARTY_TYPES}
                />
              </Grid>
              {isCompanyParty || !filters.party_type ? (
                <Grid item xs={12} md={3}>
                  <AutocompleteComponent
                    name="الشركة"
                    value={companies.find((item: any) => item.name === filters.company_name) || null}
                    refState={(e: any) => updateFilter('company_name', lookupName(e))}
                    data={companies}
                  />
                </Grid>
              ) : null}
              {!isCompanyParty || !filters.party_type ? (
                <Grid item xs={12} md={3}>
                  <TextInputComponent
                    name="اسم العميل بالعربية"
                    type="text"
                    value={filters.client_name}
                    refState={(e: any) => updateFilter('client_name', e.target.value)}
                  />
                </Grid>
              ) : null}
              <Grid item xs={12} md={3}>
                <TextInputComponent
                  name="تاريخ إقامة الدعوى"
                  type="date"
                  isDatePicker
                  value={filters.filing_date}
                  refState={(e: any) => updateFilter('filing_date', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <AutocompleteComponent
                  name="المحكمة"
                  value={courtOptions.find((c: any) => c.name === filters.court_name) || null}
                  refState={(e: any) => updateFilter('court_name', lookupName(e))}
                  data={courtOptions}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextInputComponent
                  name="رقم الدعوى"
                  type="text"
                  value={filters.case_number}
                  refState={(e: any) => updateFilter('case_number', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextInputComponent
                  name="السنة"
                  type="number"
                  value={filters.case_year}
                  refState={(e: any) => updateFilter('case_year', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <AutocompleteComponent
                  name="الدائرة"
                  value={circuitOptions.find((c: any) => c.name === filters.circuit) || null}
                  refState={(e: any) => updateFilter('circuit', lookupName(e))}
                  data={circuitOptions}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <AutocompleteComponent
                  name="الحكم"
                  value={SENTENCE_OPTIONS.find((s) => s.name === filters.judgment) || null}
                  refState={(e: any) => updateFilter('judgment', lookupName(e))}
                  data={SENTENCE_OPTIONS}
                />
              </Grid>
            </Grid>
          }
        />
        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 900 }}>
              <PartsTableHead
                headLabel={[
                  { id: 'no', label: 'م' },
                  { id: 'party', label: 'الطرف' },
                  { id: 'number', label: 'رقم / سنة' },
                  { id: 'court', label: 'المحكمة' },
                  { id: 'circuit', label: 'الدائرة' },
                  { id: 'date', label: 'تاريخ إقامة الدعوى' },
                  { id: 'judgment', label: 'الحكم' },
                  { id: 'document', label: 'المستند' },
                  { id: 'created_by', label: 'أضيف بواسطة' },
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
                      <Typography sx={{ fontWeight: 700, fontSize: 13.5 }}>
                        {row.party_label || '-'}
                      </Typography>
                      <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 600 }}>
                        {row.party_type === 'company' ? 'شركة' : 'عميل'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                        {row.case_number || '-'}/{row.case_year || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{row.court_name || '-'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{row.circuit || '-'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                        {formatDate(row.filing_date)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{row.judgment || '-'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <PdfFileCell path={row.file_path} name={row.file_name || row.file_path} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>
                        {row.created_by_name || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => router.push(`/civil-cases/${row.id}`)}
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

      <AddCivilCaseDialog
        open={openModal}
        title="إضافة دعوى مدنية"
        payload={payload}
        setPayload={setPayload}
        onClose={() => {
          setOpenModal(false);
          setPayload(emptyCivilPayload());
        }}
        onSubmit={() => {
          try {
            sessionStorage.removeItem('civil_case_add_draft');
          } catch {
            // ignore
          }
          addCase(buildSubmitForm(payload));
        }}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        title="حذف الدعوى المدنية"
        message={`هل أنت متأكد من حذف الدعوى ${deleteRow?.case_number || deleteRow?.case_code || ''}؟`}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteRow(null);
        }}
        onConfirm={() => {
          if (deleteRow?.id) deleteCase({ id: deleteRow.id });
          setDeleteOpen(false);
          setDeleteRow(null);
        }}
      />
    </DashboardContent>
  );
}
