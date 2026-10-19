import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import { CheckOutlined } from '@mui/icons-material';
import { toast, Toaster } from 'sonner';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { DashboardContent } from 'src/layouts/dashboard';
import { Scrollbar } from 'src/components/scrollbar';
import TextInputComponent from 'src/components/utils/TextInputComponent';
import ModalContainer from 'src/components/utils/ModalContainer';
import AutocompleteComponent from 'src/components/utils/AutoCompleteComponent';
import { ConfirmDeleteDialog } from 'src/components/utils/ConfirmDeleteDialog';
import { Iconify } from 'src/components/iconify';
import { FIELD_HEIGHT, fieldColors } from 'src/components/utils/field-styles';
import {
  useAddLookupMutation,
  useDeleteLookupMutation,
  useEditLookupMutation,
  useGetLookups,
  useRegisterMutation,
} from 'src/hooks/customHooks';
import { PartsTableHead } from 'src/sections/legal-cases/parts-table-head';
import { formatDate } from 'src/sections/legal-cases/utils';
import { GeoRegionsView } from 'src/sections/geo-regions/view';

const lookupTypes = [
  { id: 'company', name: 'جهة', color: '#0F766E', bg: '#CCFBF1' },
  { id: 'governorate', name: 'محافظة', color: '#166534', bg: '#DCFCE7' },
  { id: 'police_station', name: 'قسم', color: '#6D28D9', bg: '#EDE9FE' },
  { id: 'court', name: 'محكمة', color: '#1D4ED8', bg: '#DBEAFE' },
  { id: 'circuit', name: 'دائرة', color: '#7C3AED', bg: '#F3E8FF' },
  { id: 'loan_type', name: 'نوع التمويل', color: '#C2410C', bg: '#FFEDD5' },
  { id: 'package', name: 'باقة', color: '#0369A1', bg: '#E0F2FE' },
  { id: 'branch', name: 'فرع', color: '#B45309', bg: '#FEF3C7' },
];

const filterGroups = [
  { id: 'all', label: 'الكل', types: null as string[] | null },
  { id: 'companies', label: 'الجهات', types: ['company'] },
  { id: 'courts', label: 'المحاكم', types: ['court'] },
  {
    id: 'geo',
    label: 'المحافظات والأقسام والدوائر',
    types: ['governorate', 'police_station', 'circuit'],
  },
  { id: 'finance', label: 'أنواع التمويل والباقات', types: ['loan_type', 'package'] },
  { id: 'branches', label: 'الفروع', types: ['branch'] },
];

const accTypes = [
  { id: 1, name: 'موظف قانوني' },
  { id: 2, name: 'مدير' },
  { id: 3, name: 'مشرف' },
  { id: 4, name: 'شركة' },
];

const typeMeta = Object.fromEntries(lookupTypes.map((item) => [item.id, item]));

const emptyAccount = {
  name: '',
  email: '',
  type: accTypes[0],
  work_type: '',
  company_name: '',
  password: '',
  password_confirmation: '',
};

function TypePill({ type }: { type: string }) {
  const meta = typeMeta[type] || { name: type, color: '#334155', bg: '#F1F5F9' };
  return (
    <Chip
      size="small"
      label={meta.name}
      sx={{
        height: 26,
        fontWeight: 800,
        fontSize: 12,
        bgcolor: meta.bg,
        color: meta.color,
      }}
    />
  );
}

function lookupCode(row: any, index: number) {
  const prefix = String(row.type || 'REF')
    .split('_')
    .map((part: string) => part.slice(0, 2).toUpperCase())
    .join('');
  return `REF-${prefix}-${String(row.id || index + 1).padStart(2, '0')}`;
}

export function SettingsView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openModal, setOpenModal] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [payload, setPayload] = useState({ type: lookupTypes[0], name: '' });
  const [editPayload, setEditPayload] = useState({ id: 0, type: lookupTypes[0], name: '' });
  const [accountPayload, setAccountPayload] = useState(emptyAccount);
  const [accountLoading, setAccountLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'geo' || tab === 'geo-regions') {
      setActiveFilter('geo');
    }
  }, [searchParams]);

  const { data, refetch } = useGetLookups({ key: 'GetLookups_API' });
  const { mutate: addLookup } = useAddLookupMutation({ refetch });
  const { mutate: editLookup } = useEditLookupMutation({ refetch });
  const { mutate: deleteLookup } = useDeleteLookupMutation({ refetch });
  const { mutate: registerAccount } = useRegisterMutation({
    setIsLoading: setAccountLoading,
    setOpen: setAccountOpen,
    redirectOnSuccess: false,
    onSuccess: () => setAccountPayload(emptyAccount),
  });

  const rows = data?.data?.data || [];

  const filteredRows = useMemo(() => {
    const group = filterGroups.find((item) => item.id === activeFilter) || filterGroups[0];
    const query = search.trim().toLowerCase();
    return rows.filter((row: any) => {
      if (group.types && !group.types.includes(row.type)) return false;
      if (!query) return true;
      const haystack = `${row.name || ''} ${row.type || ''} ${typeMeta[row.type]?.name || ''} ${lookupCode(row, 0)}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [rows, activeFilter, search]);

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: rows.length };
    filterGroups.forEach((group) => {
      if (!group.types) return;
      counts[group.id] = rows.filter((row: any) => group.types!.includes(row.type)).length;
    });
    return counts;
  }, [rows]);

  const openEdit = (row: any) => {
    setEditPayload({
      id: row.id,
      type: typeMeta[row.type] ? { id: row.type, name: typeMeta[row.type].name, color: typeMeta[row.type].color, bg: typeMeta[row.type].bg } : lookupTypes[0],
      name: row.name || '',
    });
    setEditOpen(true);
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('البيانات المرجعية');
    worksheet.addRow(['م', 'الكود', 'النوع', 'الاسم', 'تاريخ الإنشاء']);
    filteredRows.forEach((row: any, index: number) => {
      worksheet.addRow([
        index + 1,
        lookupCode(row, index),
        typeMeta[row.type]?.name || row.type,
        row.name,
        formatDate(row.createdAt || row.created_at),
      ]);
    });
    worksheet.getRow(1).font = { bold: true };
    worksheet.columns = [{ width: 8 }, { width: 16 }, { width: 18 }, { width: 28 }, { width: 16 }];
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      'البيانات-المرجعية.xlsx'
    );
    toast.success('تم تصدير الملف');
  };

  return (
    <DashboardContent>
      <Toaster richColors expand={false} duration={5000} />

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', mb: 0.75 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
              إعدادات بيانات النظام
            </Typography>
            <Chip
              label={`${rows.length} بيان مرجعي نشط`}
              size="small"
              sx={{ height: 26, fontWeight: 800, fontSize: 12, bgcolor: '#DBEAFE', color: '#1D4ED8' }}
            />
          </Box>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 600, maxWidth: 640, lineHeight: 1.7 }}>
            إدارة جداول الجهات والمحاكم والأقسام والدوائر وأنواع التمويل، مع صلاحيات حسابات المستخدمين والبيانات المرجعية للنظام.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<Iconify icon="mingcute:add-line" width={18} />}
            onClick={() => {
              setPayload({ type: lookupTypes[0], name: '' });
              setOpenModal(true);
            }}
            sx={{ borderRadius: 2, fontWeight: 800 }}
          >
            إضافة بيان مرجعي
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="solar:user-plus-bold" width={18} />}
            onClick={() => {
              setAccountPayload(emptyAccount);
              setAccountOpen(true);
            }}
            sx={{ borderRadius: 2, fontWeight: 800 }}
          >
            إضافة حساب جديد
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:file-download-bold" width={18} />}
            onClick={exportToExcel}
            sx={{ borderRadius: 2, fontWeight: 700, borderColor: 'grey.300' }}
          >
            تصدير إكسيل
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          mb: 2.5,
          p: 2.5,
          borderRadius: 3,
          bgcolor: '#1A2942',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          backgroundImage:
            'radial-gradient(circle at 15% 20%, rgba(201,162,39,0.18), transparent 40%), radial-gradient(circle at 85% 80%, rgba(29,131,72,0.16), transparent 42%)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, minWidth: 0 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.1)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Iconify icon="solar:users-group-rounded-bold" width={24} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 16, mb: 0.5 }}>إدارة صلاحيات وحسابات المستخدمين</Typography>
            <Typography sx={{ fontSize: 12.5, fontWeight: 500, opacity: 0.8, lineHeight: 1.7, maxWidth: 520 }}>
              إنشاء حسابات جديدة للمستشارين والسادة العاملين بالنظام، مع ضبط الصلاحيات وأنواع العمل المرتبطة بكل مستخدم.
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          onClick={() => {
            setAccountPayload(emptyAccount);
            setAccountOpen(true);
          }}
          sx={{
            borderRadius: 2,
            fontWeight: 800,
            bgcolor: '#EAB308',
            color: '#1A2942',
            '&:hover': { bgcolor: '#CA8A04' },
          }}
        >
          إضافة حساب جديد
        </Button>
      </Box>

      <Card
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'grey.200',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
          overflow: 'hidden',
          mb: 2.5,
        }}
      >
        <Box sx={{ px: 2.5, pt: 2.25, pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.75 }}>
            <Iconify icon="solar:database-bold-duotone" width={20} sx={{ color: 'primary.main' }} />
            <Typography sx={{ fontWeight: 800, fontSize: 15.5, color: 'primary.main' }}>
              قائمة البيانات المرجعية الأساسية
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {filterGroups.map((group) => {
              const active = activeFilter === group.id;
              const count = filterCounts[group.id] ?? 0;
              return (
                <Button
                  key={group.id}
                  size="small"
                  onClick={() => {
                    setActiveFilter(group.id);
                    if (group.id === 'geo') {
                      setSearchParams({ tab: 'geo' }, { replace: true });
                    } else if (searchParams.get('tab')) {
                      setSearchParams({}, { replace: true });
                    }
                  }}
                  sx={{
                    borderRadius: 999,
                    px: 1.5,
                    fontWeight: 800,
                    fontSize: 12.5,
                    bgcolor: active ? 'primary.main' : '#F1F5F9',
                    color: active ? '#fff' : 'text.secondary',
                    '&:hover': { bgcolor: active ? 'primary.dark' : '#E2E8F0' },
                  }}
                >
                  {group.label} ({count})
                </Button>
              );
            })}
          </Box>

          {activeFilter !== 'geo' && (
            <OutlinedInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث باسم البيان، النوع، أو الكود..."
              startAdornment={
                <InputAdornment position="start">
                  <Iconify width={18} icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              }
              sx={{
                width: 1,
                maxWidth: 420,
                height: FIELD_HEIGHT,
                bgcolor: fieldColors.bg,
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: fieldColors.border },
              }}
            />
          )}
        </Box>

        {activeFilter === 'geo' ? (
          <Box sx={{ px: 2.5, pb: 2.5 }}>
            <GeoRegionsView embedded onChanged={refetch} />
          </Box>
        ) : (
        <Scrollbar>
          <TableContainer>
            <Table sx={{ minWidth: 900 }}>
              <PartsTableHead
                headLabel={[
                  { id: 'no', label: '#' },
                  { id: 'code', label: 'كود البيان' },
                  { id: 'type', label: 'نوع البيان المرجعي' },
                  { id: 'name', label: 'اسم البيان / الوصف' },
                  { id: 'date', label: 'تاريخ التحديث' },
                  { id: 'status', label: 'الحالة' },
                  { id: 'actions', label: 'إجراءات' },
                ]}
              />
              <TableBody>
                {filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>لا توجد بيانات مطابقة</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {filteredRows.map((row: any, index: number) => (
                  <TableRow key={row.id} hover sx={{ '& td': { borderColor: 'grey.100', py: 1.5 } }}>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 13 }}>{index + 1}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 800, fontSize: 13, direction: 'ltr', display: 'inline-block' }}>
                        {lookupCode(row, index)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <TypePill type={row.type} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 700, fontSize: 13.5 }}>{row.name}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
                        {formatDate(row.createdAt || row.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.75,
                          px: 1.25,
                          py: 0.45,
                          borderRadius: 999,
                          bgcolor: '#ECFDF5',
                          border: '1px solid #A7F3D0',
                        }}
                      >
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981' }} />
                        <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#047857' }}>نشط</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
                        <IconButton color="primary" onClick={() => openEdit(row)} size="small">
                          <Iconify icon="solar:pen-bold" width={18} />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => {
                            setSelectedRow(row);
                            setDeleteOpen(true);
                          }}
                          size="small"
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
        )}

        {activeFilter !== 'geo' && (
          <Box sx={{ px: 2.5, py: 1.75, borderTop: '1px solid', borderColor: 'grey.100' }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.secondary' }}>
              عرض {filteredRows.length} من أصل {rows.length} بيان مرجعي
            </Typography>
          </Box>
        )}
      </Card>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          {
            title: 'سجلات التدقيق والمزامنة',
            text: 'متابعة عمليات الإضافة والحذف على البيانات المرجعية لضمان سلامة الجداول المرتبطة بالقضايا.',
            icon: 'solar:clipboard-list-bold-duotone',
            color: '#1D4ED8',
          },
          {
            title: 'التوثيق الرقمي المعتمد',
            text: 'البيانات المرجعية تُستخدم في نماذج القضايا والعقود لضمان اتساق التسميات عبر النظام.',
            icon: 'solar:verified-check-bold-duotone',
            color: '#1D8348',
          },
          {
            title: 'حماية الربط التبعي',
            text: 'احذر من حذف بيان مرتبط بسجلات قضايا قائمة؛ يُفضّل المراجعة قبل أي عملية حذف.',
            icon: 'solar:shield-network-bold-duotone',
            color: '#C2410C',
          },
        ].map((item) => (
          <Grid item xs={12} md={4} key={item.title}>
            <Card
              sx={{
                p: 2.25,
                height: 1,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'grey.200',
                boxShadow: '0 6px 18px rgba(15, 23, 42, 0.04)',
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  bgcolor: `${item.color}14`,
                  color: item.color,
                  display: 'grid',
                  placeItems: 'center',
                  mb: 1.25,
                }}
              >
                <Iconify icon={item.icon} width={20} />
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: 14, mb: 0.75, color: 'primary.main' }}>{item.title}</Typography>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: 'text.secondary', lineHeight: 1.7 }}>
                {item.text}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <ModalContainer
        modalState={openModal}
        modalChangeState={() => setOpenModal(false)}
        modalTitle="إضافة بيان نظام"
        modalSubtitle="إضافة بيان مرجعي جديد إلى جداول النظام"
        infoBanner="اختر نوع البيان ثم أدخل الاسم كما سيظهر في نماذج القضايا."
        btnTitle="تسجيل"
        endIcon={<CheckOutlined />}
        modalAction={() => {
          addLookup({ type: payload.type?.id || payload.type, name: payload.name });
          setOpenModal(false);
          setPayload({ type: lookupTypes[0], name: '' });
        }}
      >
        <AutocompleteComponent
          name="النوع"
          value={payload.type}
          refState={(e: any) => setPayload((p) => ({ ...p, type: e }))}
          data={lookupTypes}
        />
        <TextInputComponent
          name="الاسم"
          type="text"
          value={payload.name}
          refState={(e: any) => setPayload((p) => ({ ...p, name: e.target.value }))}
        />
      </ModalContainer>

      <ModalContainer
        modalState={editOpen}
        modalChangeState={() => setEditOpen(false)}
        modalTitle="تعديل بيان نظام"
        modalSubtitle="تحديث بيانات البيان المرجعي المحدد"
        statusChip="تعديل"
        btnTitle="حفظ التعديل"
        endIcon={<CheckOutlined />}
        modalAction={() => {
          editLookup({
            id: editPayload.id,
            axiosdata: {
              type: editPayload.type?.id || editPayload.type,
              name: editPayload.name,
            },
          });
          setEditOpen(false);
        }}
      >
        <AutocompleteComponent
          name="النوع"
          value={editPayload.type}
          refState={(e: any) => setEditPayload((p) => ({ ...p, type: e }))}
          data={lookupTypes}
        />
        <TextInputComponent
          name="الاسم"
          type="text"
          value={editPayload.name}
          refState={(e: any) => setEditPayload((p) => ({ ...p, name: e.target.value }))}
        />
      </ModalContainer>

      <ModalContainer
        modalState={accountOpen}
        modalChangeState={() => setAccountOpen(false)}
        modalTitle="إضافة حساب جديد"
        modalSubtitle="إنشاء حساب مستخدم وصلاحياته داخل النظام"
        infoBanner="تأكد من صحة البريد الإلكتروني ونوع الحساب قبل التسجيل."
        btnTitle="تسجيل الحساب"
        endIcon={<CheckOutlined />}
        disabled={accountLoading}
        modalAction={() => {
          registerAccount({
            name: accountPayload.name,
            email: accountPayload.email,
            password: accountPayload.password,
            password_confirmation: accountPayload.password_confirmation,
            type: accountPayload.type?.name || accountPayload.type,
            work_type: accountPayload.work_type,
            company_name: accountPayload.company_name || undefined,
          });
        }}
      >
        <TextInputComponent
          name="الاسم"
          type="text"
          value={accountPayload.name}
          refState={(e: any) => setAccountPayload((p) => ({ ...p, name: e.target.value }))}
          required
        />
        <TextInputComponent
          name="البريد الالكتروني"
          type="email"
          value={accountPayload.email}
          refState={(e: any) => setAccountPayload((p) => ({ ...p, email: e.target.value }))}
          required
        />
        <TextInputComponent
          name="كلمة المرور"
          type="password"
          value={accountPayload.password}
          refState={(e: any) => setAccountPayload((p) => ({ ...p, password: e.target.value }))}
          required
        />
        <TextInputComponent
          name="تأكيد كلمة المرور"
          type="password"
          value={accountPayload.password_confirmation}
          refState={(e: any) => setAccountPayload((p) => ({ ...p, password_confirmation: e.target.value }))}
          required
        />
        <AutocompleteComponent
          name="النوع"
          value={accountPayload.type}
          refState={(e: any) => setAccountPayload((p) => ({ ...p, type: e }))}
          data={accTypes}
        />
        {accountPayload.type?.name === 'شركة' && (
          <TextInputComponent
            name="اسم الشركة"
            type="text"
            value={accountPayload.company_name}
            refState={(e: any) => setAccountPayload((p) => ({ ...p, company_name: e.target.value }))}
          />
        )}
        <TextInputComponent
          name="طبيعة العمل"
          type="text"
          value={accountPayload.work_type}
          refState={(e: any) => setAccountPayload((p) => ({ ...p, work_type: e.target.value }))}
        />
      </ModalContainer>

      <ConfirmDeleteDialog
        open={deleteOpen}
        title="تأكيد حذف البيان"
        message={`هل أنت متأكد من حذف البيان "${selectedRow?.name || ''}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedRow(null);
        }}
        onConfirm={() => {
          if (selectedRow?.id) deleteLookup({ id: selectedRow.id });
        }}
      />
    </DashboardContent>
  );
}
