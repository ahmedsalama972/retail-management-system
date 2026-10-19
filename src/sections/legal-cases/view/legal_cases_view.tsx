import { useCallback, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import Grid from '@mui/material/Grid';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
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
  useAddLegalCaseMutation,
  useDeleteLegalCaseMutation,
  useGetAllLegalCases,
  useGetLegalCaseCompanies,
  useGetLegalCases,
  useGetLookups,
} from 'src/hooks/customHooks';

const CASE_TYPES = [
  { id: 1, name: 'مباشرة' },
  { id: 2, name: 'قسم' },
];

const lookupName = (value: any) => (typeof value === 'object' && value ? value.name || '' : value || '');

import { TableNoData } from '../table-no-data';
import { PartTableRow } from '../part-table-row';
import { PartsTableHead } from '../parts-table-head';
import { TableEmptyRows } from '../table-empty-rows';
import { PartTableToolbar } from '../part-table-toolbar';
import { emptyRows, getComparator } from '../utils';
import { AddLegalCaseDialog, PARTY_TYPES, type LegalCasePayload } from '../add-legal-case-dialog';
import { caseDetailsPath } from 'src/routes/case-paths';
import { ConfirmDeleteDialog } from 'src/components/utils/ConfirmDeleteDialog';

type LegalCasesViewProps = {
  title: string;
  addLabel?: string;
  defaultFilters?: Record<string, any>;
};

const emptyPayload: LegalCasePayload = {
  party_type: PARTY_TYPES[1],
  client_id: '',
  client_app_id: '',
  client_number: '',
  full_name: '',
  full_name_en: '',
  mobile: '',
  phone_1: '',
  phone_2: '',
  office_phone: '',
  national_id: '',
  dob: '',
  company_name: '',
  work_office: '',
  home_address: '',
  work_address: '',
  request_date: '',
  contract_number: '',
  loan_type: '',
  package: '',
  branch_name: '',
  price: '',
  downpayment_percent: '',
  downpayment_value: '',
  loan_amount: '',
  tenor_months: '',
  interest_rate: '',
  monthly_payment: '',
  case_code: '',
  case_number: '',
  case_year: '',
  case_date: '',
  check_number: '',
  check_due_date: '',
  status_date: '',
  governorate: '',
  police_station: '',
  court_name: '',
  case_type: { id: 1, name: 'مباشرة' },
  circuit: '',
  notes: '',
  hearings: [],
  gon7a: null,
};


export function LegalCasesView({ title, addLabel = 'إضافة جنحة', defaultFilters = {} }: LegalCasesViewProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [filters, setFilters] = useState({
    client_app_id: '',
    client_number: '',
    client_name: '',
    mobile: '',
    national_id: '',
    contract_number: '',
    company_name: '',
    check_number: '',
    check_due_date: '',
    case_number: '',
    case_year: '',
    case_date: '',
    status_date: '',
    court_name: '',
    case_type: '',
    governorate: '',
    police_station: '',
    circuit: '',
    is_closed: defaultFilters.is_closed ?? '',
    pending: defaultFilters.pending ?? '',
  });
  const [payload, setPayload] = useState(emptyPayload);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<any>(null);
  const table = useTable({ page, setPage });
  const arabicNumberFormat = new Intl.NumberFormat('ar-EG');

  const updateFilter = (key: string, value: any) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const queryFilters = {
    ...defaultFilters,
    client_app_id: filters.client_app_id,
    client_number: filters.client_number,
    client_name: filters.client_name,
    mobile: filters.mobile,
    national_id: filters.national_id,
    contract_number: filters.contract_number,
    company_name: filters.company_name,
    check_number: filters.check_number,
    check_due_date: filters.check_due_date,
    case_number: filters.case_number,
    case_year: filters.case_year,
    case_date: filters.case_date,
    status_date: filters.status_date,
    court_name: filters.court_name,
    case_type: filters.case_type,
    governorate: filters.governorate,
    police_station: filters.police_station,
    circuit: filters.circuit,
    ...(filters.is_closed === true || filters.is_closed === false ? { is_closed: filters.is_closed } : {}),
  };

  const companyListFilters = {
    ...defaultFilters,
    client_app_id: filters.client_app_id,
    client_number: filters.client_number,
    contract_number: filters.contract_number,
    client_name: filters.client_name,
    mobile: filters.mobile,
    ...(filters.is_closed === true || filters.is_closed === false ? { is_closed: filters.is_closed } : {}),
  };

  const { data: casesResponse, refetch } = useGetLegalCases({
    key: `GetLegalCases_API_${title}`,
    page,
    search,
    filters: queryFilters,
    setIsLoading,
  });

  const { data: companiesResponse } = useGetLegalCaseCompanies({
    key: `GetLegalCaseCompanies_API_${title}`,
    filters: companyListFilters,
    search,
  });

  const { data: lookupsResponse } = useGetLookups({ key: `GetLookups_API_LegalFilters_${title}` });

  const { refetch: refetchAll } = useGetAllLegalCases({
    key: `GetAllLegalCases_API_${title}`,
    filters: queryFilters,
    setIsLoading,
  });

  const rows = casesResponse?.data?.data || [];
  const companyOptions: string[] = companiesResponse?.data?.data || [];
  const lookups = lookupsResponse?.data?.data || [];
  const governorateOptions = useMemo(
    () => lookups.filter((item: any) => item.type === 'governorate'),
    [lookups]
  );
  const selectedGov = useMemo(
    () => governorateOptions.find((item: any) => item.name === filters.governorate),
    [governorateOptions, filters.governorate]
  );
  const stationOptions = useMemo(
    () =>
      selectedGov
        ? lookups.filter((item: any) => item.type === 'police_station' && item.parent_id === selectedGov.id)
        : [],
    [lookups, selectedGov]
  );
  const selectedStation = useMemo(
    () => stationOptions.find((item: any) => item.name === filters.police_station),
    [stationOptions, filters.police_station]
  );
  const circuitOptions = useMemo(
    () =>
      selectedStation
        ? lookups.filter((item: any) => item.type === 'circuit' && item.parent_id === selectedStation.id)
        : [],
    [lookups, selectedStation]
  );
  const courtOptions = useMemo(() => lookups.filter((item: any) => item.type === 'court'), [lookups]);
  const notFound = rows.length === 0;
  const sortedRows = Array.isArray(rows) ? rows.slice().sort(getComparator(table.order, table.orderBy)) : [];
  const activeFilterCount = [
    filters.client_app_id,
    filters.client_number,
    filters.client_name,
    filters.mobile,
    filters.national_id,
    filters.contract_number,
    filters.company_name,
    filters.check_number,
    filters.check_due_date,
    filters.case_number,
    filters.case_year,
    filters.case_date,
    filters.status_date,
    filters.court_name,
    filters.case_type,
    filters.governorate,
    filters.police_station,
    filters.circuit,
    filters.is_closed === true,
  ].filter(Boolean).length;

  const { mutate: addCase } = useAddLegalCaseMutation({
    setOpen: setOpenModal,
    refetch,
    setIsLoading,
  });
  const { mutate: deleteCase } = useDeleteLegalCaseMutation({
    setIsLoading,
    refetch,
  });

  const handleSubmit = () => {
    const data = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (key === 'case_code') return;
      if (key === 'hearings') {
        data.append('hearings', JSON.stringify(value || []));
        return;
      }
      if (key === 'party_type') {
        const partyId = typeof value === 'object' && value ? (value as any).id : value;
        data.append('party_type', String(partyId || 'client'));
        return;
      }
      if (key === 'case_type') {
        const typeName = typeof value === 'object' && value ? (value as any).name : value;
        data.append('case_type', String(typeName || ''));
        return;
      }
      if (key === 'branch_name') {
        const branchName = typeof value === 'object' && value ? (value as any).name : value;
        data.append('branch_name', String(branchName || ''));
        return;
      }
      if (value instanceof File) {
        data.append(key, value);
      } else if (value !== null && value !== undefined) {
        data.append(key, String(value));
      }
    });
    try {
      sessionStorage.removeItem('legal_case_add_draft');
    } catch {
      // ignore
    }
    addCase(data);
  };

  const exportToExcel = async () => {
    setIsLoading(true);
    try {
      const result = await refetchAll();
      const dataarray = result?.data?.data?.data || result?.data?.data || [];
      if (!Array.isArray(dataarray)) return;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('الجنح');
      const headers = [
        'م',
        'رقم تطبيق العميل',
        'رقم العقد',
        'اسم العميل',
        'الشركة',
        'الموبايل',
        'كود القضية',
        'رقم القضية',
        'سنة القضية',
        'رقم الشيك',
        'تاريخ الاستحقاق',
        'المحكمة',
        'النوع',
        'تاريخ المحضر',
        'أضيف بواسطة',
        'الحالة',
        'ملاحظات',
      ];
      worksheet.addRow(headers);
      dataarray.forEach((item: any, index: number) => {
        worksheet.addRow([
          index + 1,
          item.client?.client_app_id || item.client?.client_number,
          item.contract?.contract_number,
          item.client?.full_name,
          item.contract?.branch_name || item.contract?.company_name || item.client?.company_name,
          item.client?.mobile,
          item.case_code,
          item.case_number,
          item.case_year,
          item.check_number,
          item.check_due_date,
          item.court_name,
          item.case_type,
          item.status_date,
          item.created_by_name || item.created_by?.name,
          item.is_closed ? 'مغلق' : 'مفتوح',
          item.notes,
        ]);
      });
      worksheet.getRow(1).font = { bold: true };
      worksheet.columns = headers.map(() => ({ width: 22 }));
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'الجنح.xlsx');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardContent>
      {isLoading && <CircularLoader />}
      <Toaster richColors expand={false} duration={5000} style={{ zIndex: 20000 }} position="top-center" />

      <Box display="flex" alignItems="center" mb={2.5} sx={{ justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5 }}>
            {title}
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 600 }}>
            {arabicNumberFormat.format(casesResponse?.data?.total || 0)} جنحة نشطة
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => {
              setPayload(emptyPayload);
              setOpenModal(true);
            }}
            sx={{ borderRadius: 2, px: 2.5, py: 1, fontWeight: 700, boxShadow: '0 8px 20px rgba(26,41,66,0.25)' }}
          >
            {addLabel}
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<Iconify icon="mingcute:upload-line" />}
            onClick={exportToExcel}
            sx={{ borderRadius: 2, px: 2.5, py: 1, fontWeight: 700 }}
          >
            تصدير إلى إكسل
          </Button>
        </Box>
      </Box>

      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
          border: '1px solid',
          borderColor: 'grey.200',
          overflow: 'hidden',
        }}
      >
        <PartTableToolbar
          filterName={search}
          placeholder="بحث عام...."
          onFilterName={(event) => {
            setSearch(event.target.value);
            table.onResetPage();
          }}
          filterOpen={filtersOpen}
          onToggleFilter={() => setFiltersOpen((open) => !open)}
          activeFilterCount={activeFilterCount}
          companyOptions={companyOptions}
          selectedCompany={filters.company_name}
          companyLabel="الشركة"
          onCompanyChange={(company) => {
            setPage(1);
            setFilters((prev) => ({ ...prev, company_name: company }));
          }}
          filterContent={
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextInputComponent
                  name="رقم تطبيق العميل"
                  type="text"
                  value={filters.client_app_id}
                  refState={(e: any) => updateFilter('client_app_id', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextInputComponent
                  name="رقم العميل"
                  type="text"
                  value={filters.client_number}
                  refState={(e: any) => updateFilter('client_number', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextInputComponent
                  name="اسم العميل بالعربية"
                  type="text"
                  value={filters.client_name}
                  refState={(e: any) => updateFilter('client_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextInputComponent
                  name="رقم الموبايل"
                  type="text"
                  value={filters.mobile}
                  refState={(e: any) => updateFilter('mobile', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextInputComponent
                  name="الرقم القومي"
                  type="text"
                  value={filters.national_id}
                  refState={(e: any) => updateFilter('national_id', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextInputComponent
                  name="رقم العقد"
                  type="text"
                  value={filters.contract_number}
                  refState={(e: any) => updateFilter('contract_number', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextInputComponent
                  name="رقم الشيك"
                  type="text"
                  value={filters.check_number}
                  refState={(e: any) => updateFilter('check_number', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextInputComponent
                  name="تاريخ الاستحقاق"
                  type="date"
                  isDatePicker
                  value={filters.check_due_date}
                  refState={(e: any) => updateFilter('check_due_date', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextInputComponent
                  name="رقم القضية"
                  type="text"
                  value={filters.case_number}
                  refState={(e: any) => updateFilter('case_number', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextInputComponent
                  name="سنة القضية"
                  type="number"
                  value={filters.case_year}
                  refState={(e: any) => updateFilter('case_year', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextInputComponent
                  name="تاريخ القضية"
                  type="date"
                  isDatePicker
                  value={filters.case_date}
                  refState={(e: any) => updateFilter('case_date', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextInputComponent
                  name="تاريخ المحضر"
                  type="date"
                  isDatePicker
                  value={filters.status_date}
                  refState={(e: any) => updateFilter('status_date', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <AutocompleteComponent
                  name="المحكمة"
                  value={courtOptions.find((item: any) => item.name === filters.court_name) || null}
                  refState={(e: any) => updateFilter('court_name', lookupName(e))}
                  data={courtOptions}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <AutocompleteComponent
                  name="النوع"
                  value={CASE_TYPES.find((item) => item.name === filters.case_type) || null}
                  refState={(e: any) => updateFilter('case_type', lookupName(e))}
                  data={CASE_TYPES}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <AutocompleteComponent
                  name="المحافظة"
                  value={selectedGov || null}
                  refState={(e: any) => {
                    setPage(1);
                    setFilters((prev) => ({
                      ...prev,
                      governorate: lookupName(e),
                      police_station: '',
                      circuit: '',
                    }));
                  }}
                  data={governorateOptions}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <AutocompleteComponent
                  name="القسم"
                  value={selectedStation || null}
                  refState={(e: any) => {
                    setPage(1);
                    setFilters((prev) => ({
                      ...prev,
                      police_station: lookupName(e),
                      circuit: '',
                    }));
                  }}
                  data={stationOptions}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <AutocompleteComponent
                  name="الدائرة"
                  value={circuitOptions.find((item: any) => item.name === filters.circuit) || null}
                  refState={(e: any) => updateFilter('circuit', lookupName(e))}
                  data={circuitOptions}
                />
              </Grid>
              <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.is_closed === true}
                      onChange={(e) => updateFilter('is_closed', e.target.checked ? true : '')}
                    />
                  }
                  label="مغلق"
                />
              </Grid>
            </Grid>
          }
        />
        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <PartsTableHead
                headLabel={[
                  { id: 'no', label: 'م' },
                  { id: 'client_app', label: 'رقم تطبيق العميل' },
                  { id: 'contract', label: 'رقم العقد' },
                  { id: 'name', label: 'اسم العميل' },
                  { id: 'company', label: 'الشركة' },
                  { id: 'mobile', label: 'الموبايل' },
                  { id: 'code', label: 'كود القضية' },
                  { id: 'number', label: 'رقم / سنة' },
                  { id: 'court', label: 'المحكمة' },
                  { id: 'type', label: 'النوع' },
                  { id: 'status', label: 'الحالة' },
                  { id: 'date', label: 'تاريخ المحضر' },
                  { id: 'created_by', label: 'أضيف بواسطة' },
                  { id: 'gon7a', label: 'الجنحة' },
                  { id: 'mo3arda', label: 'المعارضة' },
                  { id: 'est2naf', label: 'الاستئناف' },
                  { id: 'actions', label: '' },
                ]}
              />
              <TableBody>
                {sortedRows.map((row: any, index: number) => (
                  <PartTableRow
                    key={row.id}
                    index={index}
                    row={row}
                    page={page}
                    rowsPerPage={casesResponse?.data?.per_page}
                    handleOpen={() => router.push(caseDetailsPath(row.id))}
                    onDelete={() => {
                      setDeleteRow(row);
                      setDeleteOpen(true);
                    }}
                  />
                ))}
                <TableEmptyRows height={68} emptyRows={emptyRows(table.page, 0, sortedRows.length)} />
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
          count={casesResponse?.data?.total || 0}
          rowsPerPage={casesResponse?.data?.per_page || 10}
          onPageChange={(_, newPage) => table.onChangePage(newPage + 1)}
          rowsPerPageOptions={[]}
          labelDisplayedRows={({ from, to, count }) =>
            `عرض ${arabicNumberFormat.format(from)}–${arabicNumberFormat.format(to)} من ${count !== -1 ? arabicNumberFormat.format(count) : `أكثر من ${arabicNumberFormat.format(to)}`}`
          }
        />
      </Card>

      <AddLegalCaseDialog
        open={openModal}
        title={addLabel}
        payload={payload}
        setPayload={setPayload}
        onClose={() => {
          setOpenModal(false);
          setPayload(emptyPayload);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        title="حذف الجنحة"
        message={`هل أنت متأكد من حذف الجنحة ${deleteRow?.case_code || deleteRow?.id || ''}؟ لا يمكن التراجع عن هذا الإجراء.`}
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

export function useTable({ page, setPage }: any) {
  const [orderBy, setOrderBy] = useState('id');
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const onResetPage = useCallback(() => setPage(1), [setPage]);
  const onChangePage = useCallback((newPage: number) => setPage(newPage), [setPage]);

  return { page, order, orderBy, selected, onResetPage, onChangePage, setOrderBy };
}
