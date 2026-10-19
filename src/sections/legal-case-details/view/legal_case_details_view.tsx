import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import { CheckOutlined } from '@mui/icons-material';
import { toast, Toaster } from 'sonner';

import { DashboardContent } from 'src/layouts/dashboard';
import { CircularLoader } from 'src/utils/CircularLoader';
import { Iconify } from 'src/components/iconify';
import TextInputComponent from 'src/components/utils/TextInputComponent';
import ModalContainer from 'src/components/utils/ModalContainer';
import { PDFUpload } from 'src/components/file-upload/pdf-upload';
import { PdfFileCell } from 'src/components/utils/PdfFileCell';
import { useRouter } from 'src/routes/hooks';
import AutocompleteComponent from 'src/components/utils/AutoCompleteComponent';
import {
  useAddCaseAppealMutation,
  useAddCaseHearingMutation,
  useAddCaseOppositionMutation,
  useAddCaseVerdictMutation,
  useAddWarningMutation,
  useEditLegalCaseMutation,
  useGetLegalCase,
  useGetLookups,
} from 'src/hooks/customHooks';
import { formatDate } from 'src/sections/legal-cases/utils';
import { SENTENCE_OPTIONS } from 'src/sections/legal-cases/sentence-options';
import { caseSignPath, getListBasePath } from 'src/routes/case-paths';
import { exportPrintLikePdf } from 'src/utils/export-element-pdf';

import '../case-details-print.css';

const CASE_TYPES = [
  { id: 1, name: 'مباشرة' },
  { id: 2, name: 'قسم' },
];

const warningTargets = [
  { id: 'client', name: 'على العميل' },
  { id: 'contract', name: 'على العقد' },
];

const emptyOppositionPayload = {
  type: 'opposition',
  enumeration_number: '',
  enumeration_year: '',
  hearing_date: '',
  decision: '',
  file: null as File | null,
};

const money = (value: any) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 2 }).format(num);
};

function InfoCell({
  label,
  value,
  span,
  trailing,
}: {
  label: string;
  value?: ReactNode;
  span?: number;
  trailing?: ReactNode;
}) {
  return (
    <Grid item xs={12} sm={6} md={span || 3}>
      <Box
        sx={{
          height: 1,
          minHeight: 72,
          px: 1.5,
          py: 1.15,
          borderRadius: 2,
          bgcolor: '#F7F9FC',
          border: '1px solid #E8EEF5',
        }}
      >
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', mb: 0.6 }}>
          {label}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#0F172A', lineHeight: 1.45 }}>
            {value || '-'}
          </Typography>
          {trailing}
        </Box>
      </Box>
    </Grid>
  );
}

function SectionCard({
  title,
  icon,
  iconColor = '#1A2942',
  action,
  children,
}: {
  title: string;
  icon: string;
  iconColor?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box
      className="case-report-section"
      sx={{
        mb: 2.5,
        borderRadius: 3,
        bgcolor: '#fff',
        border: '1px solid',
        borderColor: 'grey.200',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
        overflow: 'hidden',
      }}
    >
      <Box
        className="case-report-section__head"
        sx={{
          px: 2.25,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          flexWrap: 'wrap',
          borderBottom: '1px solid',
          borderColor: 'grey.100',
          bgcolor: '#FAFBFD',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: `${iconColor}14`,
              color: iconColor,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Iconify icon={icon} width={18} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: 15.5, color: 'primary.main' }}>{title}</Typography>
        </Box>
        {action ? <Box className="no-print">{action}</Box> : null}
      </Box>
      <Box sx={{ p: 2.25 }}>{children}</Box>
    </Box>
  );
}

function TimelineItem({
  date,
  title,
  body,
  badge,
  badgeColor = 'warning',
}: {
  date?: string;
  title?: string;
  body?: string;
  badge?: string;
  badgeColor?: 'warning' | 'success' | 'info' | 'default';
}) {
  const colors = {
    warning: { bg: '#FEF3C7', color: '#B45309' },
    success: { bg: '#DCFCE7', color: '#166534' },
    info: { bg: '#DBEAFE', color: '#1D4ED8' },
    default: { bg: '#F1F5F9', color: '#475569' },
  }[badgeColor];

  return (
    <Box
      className="case-report-keep"
      sx={{
        p: 1.75,
        borderRadius: 2,
        bgcolor: '#F8FAFC',
        border: '1px solid #E2E8F0',
        mb: 1.25,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.75, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.secondary' }} dir="ltr">
          {date || '-'}
        </Typography>
        {badge && (
          <Chip
            size="small"
            label={badge}
            sx={{ height: 24, fontWeight: 700, fontSize: 11.5, bgcolor: colors.bg, color: colors.color }}
          />
        )}
      </Box>
      {title && (
        <Typography sx={{ fontWeight: 800, fontSize: 14, mb: body ? 0.5 : 0, color: '#0F172A' }}>
          {title}
        </Typography>
      )}
      {body && (
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', lineHeight: 1.7 }}>
          {body}
        </Typography>
      )}
    </Box>
  );
}

function EmptyState({ text = 'لا توجد بيانات مسجّلة بعد' }: { text?: string }) {
  return (
    <Box
      sx={{
        py: 3,
        px: 2,
        borderRadius: 2,
        border: '1px dashed',
        borderColor: 'grey.300',
        bgcolor: '#FBFCFD',
        textAlign: 'center',
      }}
    >
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.disabled' }}>{text}</Typography>
    </Box>
  );
}

function AddActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      variant="contained"
      color="primary"
      onClick={onClick}
      startIcon={<Iconify icon="mingcute:add-line" width={18} />}
      sx={{ borderRadius: 2, fontWeight: 800, px: 1.75 }}
    >
      {label}
    </Button>
  );
}

export function LegalCaseDetailsView() {
  const { id } = useParams();
  const router = useRouter();
  const listBase = getListBasePath();
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hearingOpen, setHearingOpen] = useState(false);
  const [verdictOpen, setVerdictOpen] = useState(false);
  const [oppositionOpen, setOppositionOpen] = useState(false);
  const [appealOppositionOpen, setAppealOppositionOpen] = useState(false);
  const [appealOpen, setAppealOpen] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [casePayload, setCasePayload] = useState<any>({});
  const [hearingPayload, setHearingPayload] = useState({ hearing_date: '', status: '', notes: '' });
  const [verdictPayload, setVerdictPayload] = useState({
    sentence: SENTENCE_OPTIONS[0] as (typeof SENTENCE_OPTIONS)[number] | null,
    bail_amount: '',
    fine_amount: '',
    expiry_date: '',
    notes: '',
    verdict_file: null as File | null,
  });
  const [oppositionPayload, setOppositionPayload] = useState({ ...emptyOppositionPayload, type: 'opposition' });
  const [appealOppositionPayload, setAppealOppositionPayload] = useState({
    ...emptyOppositionPayload,
    type: 'appeal_opposition',
  });
  const [appealPayload, setAppealPayload] = useState({
    appeal_date: '',
    appeal_number: '',
    appeal_year: '',
    court_name: '',
    circuit: '',
    hearing_date: '',
    decision: '',
    notes: '',
    file: null as File | null,
  });
  const [warningPayload, setWarningPayload] = useState({
    target: 'client',
    warning_date: '',
    notes: '',
    file: null as File | null,
  });

  const { data, refetch } = useGetLegalCase({ key: 'GetLegalCase_API', id, setIsLoading });
  const legalCase = data?.data?.data;
  const client = legalCase?.client || legalCase?.contract?.client;
  const contract = legalCase?.contract;

  const { data: lookupsResponse } = useGetLookups({ key: 'GetLookups_API' });
  const lookups = lookupsResponse?.data?.data || [];
  const lookupByType = (type: string) => lookups.filter((item: any) => item.type === type);

  const { mutate: saveCase } = useEditLegalCaseMutation({ setIsLoading, refetch });
  const { mutate: addHearing } = useAddCaseHearingMutation({ setIsLoading, refetch });
  const { mutate: addVerdict } = useAddCaseVerdictMutation({ setIsLoading, refetch });
  const { mutate: addOpposition } = useAddCaseOppositionMutation({ setIsLoading, refetch });
  const { mutate: addAppeal } = useAddCaseAppealMutation({ setIsLoading, refetch });
  const { mutate: addWarning } = useAddWarningMutation({ setOpen: setWarningOpen, setIsLoading, refetch });

  const mergedCase = useMemo(
    () => ({
      ...legalCase,
      ...casePayload,
    }),
    [legalCase, casePayload]
  );

  const selectedGov = useMemo(
    () =>
      lookups.find(
        (item: any) => item.type === 'governorate' && item.name === (mergedCase?.governorate || '')
      ),
    [lookups, mergedCase?.governorate]
  );
  const selectedStation = useMemo(
    () =>
      lookups.find(
        (item: any) =>
          item.type === 'police_station' &&
          item.name === (mergedCase?.police_station || '') &&
          (!selectedGov || item.parent_id === selectedGov.id)
      ),
    [lookups, mergedCase?.police_station, selectedGov]
  );
  const stationOptions = useMemo(
    () =>
      selectedGov
        ? lookups.filter((item: any) => item.type === 'police_station' && item.parent_id === selectedGov.id)
        : [],
    [lookups, selectedGov]
  );
  const circuitOptions = useMemo(
    () =>
      selectedStation
        ? lookups.filter((item: any) => item.type === 'circuit' && item.parent_id === selectedStation.id)
        : [],
    [lookups, selectedStation]
  );

  if (!legalCase) {
    return (
      <DashboardContent>
        <CircularLoader />
      </DashboardContent>
    );
  }

  const updateCaseField = (name: string, value: any) => {
    setCasePayload((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSaveCase = () => {
    const form = new FormData();
    const payload = {
      full_name: client?.full_name,
      full_name_en: client?.full_name_en,
      mobile: client?.mobile,
      phone_1: client?.phone_1,
      national_id: client?.national_id,
      dob: client?.dob,
      company_name: contract?.company_name,
      work_office: client?.work_office,
      contract_number: contract?.contract_number,
      loan_type: contract?.loan_type,
      package: contract?.package,
      branch_name: contract?.branch_name,
      price: contract?.price,
      downpayment_percent: contract?.downpayment_percent,
      downpayment_value: contract?.downpayment_value,
      loan_amount: contract?.loan_amount,
      tenor_months: contract?.tenor_months,
      interest_rate: contract?.interest_rate,
      monthly_payment: contract?.monthly_payment,
      case_code: mergedCase.case_code,
      case_number: mergedCase.case_number,
      case_year: mergedCase.case_year,
      case_date: mergedCase.case_date,
      check_number: mergedCase.check_number,
      check_due_date: mergedCase.check_due_date,
      governorate: mergedCase.governorate,
      police_station: mergedCase.police_station,
      court_name: mergedCase.court_name,
      case_type: mergedCase.case_type,
      circuit: mergedCase.circuit,
      status_date: mergedCase.status_date,
      notes: mergedCase.notes,
      is_closed: mergedCase.is_closed,
      is_settled: mergedCase.is_settled,
      newspaper_received: mergedCase.newspaper_received,
      newspaper_delivered: mergedCase.newspaper_delivered,
      ...casePayload,
    };
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) form.append(key, String(value));
    });
    saveCase({ axiosdata: form, id });
  };

  const caseLabel = legalCase.case_code || legalCase.case_number || id;
  const listTitle =
    listBase === '/pending-legal-issues'
      ? 'قضايا قانونية معلقة'
      : listBase === '/legal-cases'
        ? 'الجنح'
        : 'المشكلة القانونية';
  const statusLabel = mergedCase.is_closed ? 'مغلق' : 'قيد التداول والمتابعة';

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    if (!reportRef.current) {
      toast.error('تعذر تجهيز التقرير للطباعة');
      return;
    }
    setIsExporting(true);
    try {
      const safeName = String(caseLabel || id || 'case').replace(/[\\/:*?"<>|]+/g, '-');
      await exportPrintLikePdf(reportRef.current, {
        filename: `ملف-قضية-${safeName}.pdf`,
        marginMm: 10,
        pageWidthPx: 794,
      });
      toast.success('تم تصدير تقرير PDF');
    } catch (error) {
      console.error(error);
      toast.error('فشل تصدير تقرير PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardContent>
      {(isLoading || isExporting) && <CircularLoader />}
      <Toaster richColors expand={false} duration={5000} />

      <Box className="no-print">
        <Breadcrumbs
          separator="/"
          sx={{ mb: 1.5, '& .MuiBreadcrumbs-separator': { mx: 0.75, color: 'text.disabled' } }}
        >
          <Link component={RouterLink} to="/legal-cases" underline="hover" color="text.secondary" sx={{ fontSize: 12.5, fontWeight: 600 }}>
            الرئيسية
          </Link>
          <Link component={RouterLink} to={listBase} underline="hover" color="text.secondary" sx={{ fontSize: 12.5, fontWeight: 600 }}>
            {listTitle}
          </Link>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'primary.main' }}>
            ملف قضية: {caseLabel}
          </Typography>
        </Breadcrumbs>

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
                ملف القضية: {caseLabel}
              </Typography>
              <Chip
                label={statusLabel}
                size="small"
                sx={{
                  height: 26,
                  fontWeight: 800,
                  fontSize: 12,
                  bgcolor: mergedCase.is_closed ? 'grey.200' : '#DCFCE7',
                  color: mergedCase.is_closed ? 'text.secondary' : '#166534',
                }}
              />
            </Box>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 600 }}>
              {client?.full_name || 'عميل'} — {contract?.contract_number || 'بدون رقم عقد'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={handleSaveCase}
              startIcon={<Iconify icon="solar:diskette-bold" width={18} />}
              sx={{
                borderRadius: 2,
                fontWeight: 800,
                bgcolor: '#C2410C',
                '&:hover': { bgcolor: '#9A3412' },
              }}
            >
              حفظ التعديلات
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              disabled={isExporting}
              startIcon={<Iconify icon="solar:file-text-bold" width={18} />}
              onClick={handleExportPdf}
              sx={{ borderRadius: 2, fontWeight: 700, borderColor: 'grey.300' }}
            >
              {isExporting ? 'جاري التصدير...' : 'تصدير تقرير PDF'}
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="solar:printer-bold" width={18} />}
              onClick={handlePrint}
              sx={{ borderRadius: 2, fontWeight: 700, borderColor: 'grey.300' }}
            >
              طباعة الملف بالكامل
            </Button>
            {legalCase.gon7a_file_path && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Iconify icon="solar:pen-new-round-bold" width={18} />}
                onClick={() =>
                  router.push(caseSignPath(id!), {
                    state: { returnTo: listBase },
                  })
                }
                sx={{ borderRadius: 2, fontWeight: 800 }}
              >
                توقيع الملف
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      <Box ref={reportRef} className="case-report-print" sx={{ bgcolor: '#fff' }}>
        <Box
          className="print-only case-report-banner"
          sx={{
            mb: 2.5,
            p: 2,
            borderRadius: 2,
            bgcolor: '#1A2942',
            color: '#fff',
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: 18, mb: 0.5 }}>
            تقرير ملف القضية: {caseLabel}
          </Typography>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, opacity: 0.85 }}>
            الاستشارات القانونية — تاريخ التصدير:{' '}
            {new Date().toLocaleDateString('ar-EG')} — الحالة: {statusLabel}
          </Typography>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, opacity: 0.85, mt: 0.35 }}>
            {client?.full_name || 'عميل'} — عقد: {contract?.contract_number || '-'}
          </Typography>
        </Box>

      <Box
        className="case-report-alert"
        sx={{
          mb: 1.25,
          px: 1.75,
          py: 1.25,
          borderRadius: 2,
          bgcolor: client?.aml_flag ? '#FEF2F2' : '#ECFDF5',
          border: '1px solid',
          borderColor: client?.aml_flag ? '#FECACA' : '#A7F3D0',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Iconify
          icon={client?.aml_flag ? 'solar:danger-triangle-bold' : 'solar:shield-check-bold'}
          width={18}
          sx={{ color: client?.aml_flag ? '#B91C1C' : '#047857' }}
        />
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: client?.aml_flag ? '#991B1B' : '#065F46' }}>
          {client?.aml_flag
            ? 'العميل مدرج بقوائم مكافحة غسل الأموال وتمويل الإرهاب'
            : 'العميل غير مدرج بقوائم مكافحة غسل الأموال وتمويل الإرهاب'}
        </Typography>
      </Box>

      {client?.has_legal_cases && (
        <Box
          className="case-report-alert"
          sx={{
            mb: 2.5,
            px: 1.75,
            py: 1.25,
            borderRadius: 2,
            bgcolor: '#FFFBEB',
            border: '1px solid #FDE68A',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Iconify icon="solar:bell-bing-bold" width={18} sx={{ color: '#B45309' }} />
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>
            تنبيه: توجد قضايا سابقة مسجّلة ضد هذا العميل من قبل الشركة
          </Typography>
        </Box>
      )}

      <SectionCard title="بيانات العميل الشخصية ومحل الإقامة" icon="solar:user-bold-duotone" iconColor="#1A2942">
        <Grid container spacing={1.5}>
          <InfoCell label="رقم العميل" value={client?.client_number} />
          <InfoCell label="رقم تطبيق العميل" value={client?.client_app_id} />
          <InfoCell label="الاسم بالعربية" value={client?.full_name} />
          <InfoCell label="الاسم بالإنجليزية" value={client?.full_name_en} />
          <InfoCell
            label="الرقم القومي"
            value={client?.national_id}
            trailing={
              client?.national_id ? (
                <Chip
                  size="small"
                  label="موثق"
                  sx={{ height: 22, fontWeight: 800, fontSize: 11, bgcolor: '#DCFCE7', color: '#166534' }}
                />
              ) : undefined
            }
          />
          <InfoCell
            label="تاريخ الميلاد / السن"
            value={
              client?.dob || client?.age
                ? `${client?.age ? `${client.age} سنة` : ''}${client?.dob ? ` (${formatDate(client.dob)})` : ''}`.trim()
                : '-'
            }
          />
          <InfoCell label="الموبايل" value={client?.mobile} />
          <InfoCell label="هاتف 1" value={client?.phone_1} />
          <InfoCell label="هاتف 2" value={client?.phone_2} />
          <InfoCell label="هاتف العمل" value={client?.office_phone} />
          <InfoCell label="جهة العمل" value={client?.company_name} />
          <InfoCell label="مكتب العمل" value={client?.work_office} />
          <InfoCell label="عنوان المنزل" value={client?.home_address} span={6} />
          <InfoCell label="عنوان العمل" value={client?.work_address} span={6} />
        </Grid>
      </SectionCard>

      <SectionCard
        title="بيانات العقد والتمويل المالي"
        icon="solar:dollar-bold-duotone"
        iconColor="#C2410C"
        action={
          <Button
            variant="outlined"
            color="error"
            startIcon={<Iconify icon="solar:danger-bold" width={18} />}
            onClick={() => setWarningOpen(true)}
            sx={{ borderRadius: 2, fontWeight: 800 }}
          >
            إضافة إنذار على العميل / العقد
          </Button>
        }
      >
        <Grid container spacing={1.5}>
          <InfoCell label="رقم العقد" value={contract?.contract_number} />
          <InfoCell label="تاريخ الطلب" value={formatDate(contract?.request_date)} />
          <InfoCell label="الفرع / الشركة" value={contract?.branch_name || contract?.company_name} />
          <InfoCell label="نوع التمويل" value={contract?.loan_type} />
          <InfoCell label="الباقة" value={contract?.package} />
          <InfoCell label="السعر" value={money(contract?.price)} />
          <InfoCell label="نسبة المقدم %" value={contract?.downpayment_percent} />
          <InfoCell label="قيمة المقدم" value={money(contract?.downpayment_value)} />
          <InfoCell label="إجمالي مبلغ التمويل" value={money(contract?.loan_amount)} />
          <InfoCell label="العائد %" value={contract?.interest_rate} />
          <InfoCell label="مدة السداد بالشهور" value={contract?.tenor_months} />
        </Grid>
        {contract?.monthly_payment != null && contract?.monthly_payment !== '' && (
          <Box
            sx={{
              mt: 1.75,
              px: 1.75,
              py: 1.35,
              borderRadius: 2,
              bgcolor: '#FFF7ED',
              border: '1px solid #FED7AA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: 14, color: '#9A3412' }}>
              القسط الشهري المستحق: {money(contract.monthly_payment)} ج.م
            </Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#C2410C' }}>
              وفق بيانات العقد المسجّلة
            </Typography>
          </Box>
        )}
      </SectionCard>

      <SectionCard title="بيانات الشيك" icon="solar:card-bold-duotone" iconColor="#7C3AED">
        <Box className="no-print">
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextInputComponent
                name="رقم الشيك"
                type="text"
                value={mergedCase.check_number || ''}
                refState={(e: any) => updateCaseField('check_number', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextInputComponent
                name="تاريخ الاستحقاق"
                type="date"
                isDatePicker
                value={String(mergedCase.check_due_date || '').slice(0, 10)}
                refState={(e: any) => updateCaseField('check_due_date', e.target.value)}
              />
            </Grid>
          </Grid>
        </Box>
        <Box className="print-only" sx={{ display: 'none' }}>
          <Grid container spacing={1.5}>
            <InfoCell label="رقم الشيك" value={mergedCase.check_number} span={6} />
            <InfoCell label="تاريخ الاستحقاق" value={formatDate(mergedCase.check_due_date)} span={6} />
          </Grid>
        </Box>
      </SectionCard>

      <SectionCard title="بيانات الجنحة والمحكمة المختصة" icon="solar:buildings-2-bold-duotone" iconColor="#0F766E">
        {/* Screen: editable fields */}
        <Box className="no-print">
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextInputComponent
                name="كود القضية"
                type="text"
                value={mergedCase.case_code || ''}
                refState={() => {}}
                disabled
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextInputComponent
                name="تاريخ القضية"
                type="date"
                isDatePicker
                value={String(mergedCase.case_date || '').slice(0, 10)}
                refState={(e: any) => updateCaseField('case_date', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextInputComponent
                name="تاريخ المحضر"
                type="date"
                isDatePicker
                value={String(mergedCase.status_date || '').slice(0, 10)}
                refState={(e: any) => updateCaseField('status_date', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AutocompleteComponent
                name="المحافظة"
                value={selectedGov || null}
                refState={(e: any) => {
                  updateCaseField('governorate', e?.name || e || '');
                  updateCaseField('police_station', '');
                  updateCaseField('circuit', '');
                }}
                data={lookupByType('governorate')}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AutocompleteComponent
                name="القسم"
                value={selectedStation || null}
                refState={(e: any) => {
                  updateCaseField('police_station', e?.name || e || '');
                  updateCaseField('circuit', '');
                }}
                data={stationOptions}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AutocompleteComponent
                name="المحكمة"
                value={lookupByType('court').find((item: any) => item.name === mergedCase.court_name) || null}
                refState={(e: any) => updateCaseField('court_name', e?.name || e || '')}
                data={lookupByType('court')}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AutocompleteComponent
                name="النوع"
                value={CASE_TYPES.find((item) => item.name === mergedCase.case_type) || CASE_TYPES[0]}
                refState={(e: any) => updateCaseField('case_type', e?.name || e)}
                data={CASE_TYPES}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AutocompleteComponent
                name="الدائرة"
                value={circuitOptions.find((item: any) => item.name === mergedCase.circuit) || null}
                refState={(e: any) => updateCaseField('circuit', e?.name || e || '')}
                data={circuitOptions}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextInputComponent
                name="سنة القضية"
                type="number"
                value={mergedCase.case_year || ''}
                refState={(e: any) => updateCaseField('case_year', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextInputComponent
                name="رقم القضية"
                type="text"
                value={mergedCase.case_number || ''}
                refState={(e: any) => updateCaseField('case_number', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextInputComponent
                name="أضيف بواسطة"
                type="text"
                value={mergedCase.created_by_name || mergedCase.created_by?.name || '—'}
                refState={() => {}}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextInputComponent
                name="ملاحظات"
                type="text"
                value={mergedCase.notes || ''}
                refState={(e: any) => updateCaseField('notes', e.target.value)}
              />
            </Grid>
          </Grid>

          <Typography sx={{ mt: 1, mb: 1.25, fontWeight: 800, fontSize: 13.5, color: 'primary.main' }}>
            مؤشرات إجرائية
          </Typography>
          <Grid container spacing={1}>
            {[
              { key: 'newspaper_received', label: 'تم استلام النشر بالجريدة' },
              { key: 'is_settled', label: 'تم التصالح مع العميل' },
              { key: 'newspaper_delivered', label: 'تم تسليم النشر بالجريدة' },
              { key: 'is_closed', label: 'مغلق' },
            ].map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item.key}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(mergedCase[item.key])}
                      onChange={(e) => updateCaseField(item.key, e.target.checked)}
                    />
                  }
                  label={<Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.label}</Typography>}
                  sx={{
                    m: 0,
                    width: 1,
                    px: 1.25,
                    py: 0.75,
                    borderRadius: 2,
                    bgcolor: '#F7F9FC',
                    border: '1px solid #E8EEF5',
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Print / PDF: clean read-only cells (no form chrome or placeholders) */}
        <Box className="print-only" sx={{ display: 'none' }}>
          <Grid container spacing={1.5}>
            <InfoCell label="كود القضية" value={mergedCase.case_code} span={4} />
            <InfoCell label="تاريخ القضية" value={formatDate(mergedCase.case_date)} span={4} />
            <InfoCell label="تاريخ المحضر" value={formatDate(mergedCase.status_date)} span={4} />
            <InfoCell label="المحافظة" value={mergedCase.governorate} span={4} />
            <InfoCell label="القسم" value={mergedCase.police_station} span={4} />
            <InfoCell label="المحكمة" value={mergedCase.court_name} span={4} />
            <InfoCell label="النوع" value={mergedCase.case_type} span={4} />
            <InfoCell label="الدائرة" value={mergedCase.circuit} span={4} />
            <InfoCell label="سنة القضية" value={mergedCase.case_year} span={4} />
            <InfoCell label="رقم القضية" value={mergedCase.case_number} span={4} />
            <InfoCell
              label="أضيف بواسطة"
              value={mergedCase.created_by_name || mergedCase.created_by?.name}
              span={4}
            />
            <InfoCell label="ملاحظات" value={mergedCase.notes} span={12} />
          </Grid>
          <Typography sx={{ mt: 1.5, mb: 1, fontWeight: 800, fontSize: 13.5, color: 'primary.main' }}>
            مؤشرات إجرائية
          </Typography>
          <Grid container spacing={1}>
            {[
              { key: 'newspaper_received', label: 'تم استلام النشر بالجريدة' },
              { key: 'is_settled', label: 'تم التصالح مع العميل' },
              { key: 'newspaper_delivered', label: 'تم تسليم النشر بالجريدة' },
              { key: 'is_closed', label: 'مغلق' },
            ].map((item) => (
              <Grid item xs={12} sm={6} md={3} key={`print-${item.key}`}>
                <Box
                  className="case-report-flag"
                  sx={{
                    px: 1.25,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: mergedCase[item.key] ? '#ECFDF5' : '#F8FAFC',
                    border: '1px solid',
                    borderColor: mergedCase[item.key] ? '#A7F3D0' : '#E2E8F0',
                  }}
                >
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>
                    {mergedCase[item.key] ? '✓' : '—'} {item.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </SectionCard>

      <SectionCard
        title="1. إجراءات الجنحة والجلسات"
        icon="solar:calendar-bold-duotone"
        action={<AddActionButton label="إضافة جلسة" onClick={() => setHearingOpen(true)} />}
      >
        {(legalCase.hearings || []).length === 0 ? (
          <EmptyState />
        ) : (
          (legalCase.hearings || []).map((item: any) => (
            <TimelineItem
              key={item.id}
              date={formatDate(item.hearing_date)}
              badge={item.status || 'جلسة'}
              badgeColor="warning"
              body={item.notes || ''}
            />
          ))
        )}
      </SectionCard>

      <SectionCard
        title="2. الحكم الصادر"
        icon="solar:diploma-verified-bold-duotone"
        iconColor="#1D8348"
        action={<AddActionButton label="إضافة حكم" onClick={() => setVerdictOpen(true)} />}
      >
        {(legalCase.verdicts || []).length === 0 ? (
          <EmptyState />
        ) : (
          (legalCase.verdicts || []).map((item: any) => (
            <Box key={item.id} sx={{ mb: 1.25 }}>
              <TimelineItem
                date={formatDate(item.expiry_date)}
                badge="حكم مسجّل"
                badgeColor="success"
                title={`الحكم: ${item.sentence_label || (item.sentence_months ? `${item.sentence_months} شهر` : item.sentence_years ? `${item.sentence_years} سنة` : '-')}`}
                body={`كفالة ${money(item.bail_amount)} | غرامة ${money(item.fine_amount)}${item.notes ? ` | ${item.notes}` : ''}`}
              />
              {item.verdict_file_url && (
                <Box sx={{ mt: 0.75, pr: 1 }}>
                  <PdfFileCell path={item.verdict_file_url} name={item.verdict_file_name || item.verdict_file_url} />
                </Box>
              )}
            </Box>
          ))
        )}
      </SectionCard>

      <SectionCard
        title="3. المعارضة"
        icon="solar:document-text-bold-duotone"
        action={<AddActionButton label="إضافة معارضة" onClick={() => setOppositionOpen(true)} />}
      >
        {((legalCase.oppositions || []).filter((item: any) => item.type !== 'appeal_opposition')).length === 0 ? (
          <EmptyState />
        ) : (
          (legalCase.oppositions || [])
            .filter((item: any) => item.type !== 'appeal_opposition')
            .map((item: any) => (
              <Box key={item.id} sx={{ mb: 1.25 }}>
                <TimelineItem
                  date={formatDate(item.hearing_date)}
                  badge={
                    item.enumeration_number || item.enumeration_year
                      ? `حصر ${item.enumeration_number || '-'} / ${item.enumeration_year || '-'}`
                      : 'معارضة'
                  }
                  badgeColor="info"
                  body={item.decision || ''}
                />
                {item.file_path && (
                  <Box sx={{ mt: 0.75, pr: 1 }}>
                    <PdfFileCell path={item.file_path} name={item.file_path} />
                  </Box>
                )}
              </Box>
            ))
        )}
      </SectionCard>

      <SectionCard
        title="4. التقرير بالاستئناف وإجراءات الاستئناف"
        icon="solar:notebook-bold-duotone"
        action={<AddActionButton label="إضافة استئناف" onClick={() => setAppealOpen(true)} />}
      >
        {(legalCase.appeals || []).length === 0 ? (
          <EmptyState />
        ) : (
          (legalCase.appeals || []).map((item: any) => (
            <Box key={item.id} sx={{ mb: 1.25 }}>
              <TimelineItem
                date={formatDate(item.appeal_date)}
                badge={
                  item.appeal_number || item.appeal_year
                    ? `${item.appeal_number || '-'} / ${item.appeal_year || '-'}`
                    : 'استئناف'
                }
                badgeColor="info"
                title={`${item.court_name || ''} ${item.circuit ? `- ${item.circuit}` : ''}`.trim() || 'استئناف'}
                body={`${formatDate(item.hearing_date)}${item.decision ? ` — ${item.decision}` : ''}${item.notes ? ` — ${item.notes}` : ''}`}
              />
              {item.file_path && (
                <Box sx={{ mt: 0.75, pr: 1 }}>
                  <PdfFileCell path={item.file_path} name={item.file_path} />
                </Box>
              )}
            </Box>
          ))
        )}
      </SectionCard>

      <SectionCard
        title="5. المعارضة الاستئنافية"
        icon="solar:document-add-bold-duotone"
        action={
          <AddActionButton label="إضافة معارضة استئنافية" onClick={() => setAppealOppositionOpen(true)} />
        }
      >
        {((legalCase.oppositions || []).filter((item: any) => item.type === 'appeal_opposition')).length === 0 ? (
          <EmptyState />
        ) : (
          (legalCase.oppositions || [])
            .filter((item: any) => item.type === 'appeal_opposition')
            .map((item: any) => (
              <Box key={item.id} sx={{ mb: 1.25 }}>
                <TimelineItem
                  date={formatDate(item.hearing_date)}
                  badge={
                    item.enumeration_number || item.enumeration_year
                      ? `حصر ${item.enumeration_number || '-'} / ${item.enumeration_year || '-'}`
                      : 'معارضة استئنافية'
                  }
                  badgeColor="warning"
                  body={item.decision || ''}
                />
                {item.file_path && (
                  <Box sx={{ mt: 0.75, pr: 1 }}>
                    <PdfFileCell path={item.file_path} name={item.file_path} />
                  </Box>
                )}
              </Box>
            ))
        )}
      </SectionCard>

      <Box
        className="case-report-footer"
        sx={{
          mt: 1,
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
          الاستشارات القانونية — ملف القضية
        </Typography>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.disabled' }} dir="ltr">
          v2.4.1 · مستوى السرية: داخلي
        </Typography>
      </Box>
      </Box>

      <Box className="no-print">
      <ModalContainer
        modalState={hearingOpen}
        modalChangeState={() => setHearingOpen(false)}
        modalTitle="إضافة جلسة"
        modalSubtitle="تسجيل بيانات جلسة جديدة مرتبطة بالدعوى"
        infoBanner="يرجى إدخال تاريخ الجلسة وحالة القضية بدقة قبل التسجيل."
        btnTitle="تسجيل"
        endIcon={<CheckOutlined />}
        modalAction={() => {
          addHearing({ id, axiosdata: hearingPayload });
          setHearingOpen(false);
        }}
      >
        <TextInputComponent name="تاريخ الجلسة" type="date" isDatePicker value={hearingPayload.hearing_date} refState={(e: any) => setHearingPayload((p) => ({ ...p, hearing_date: e.target.value }))} />
        <TextInputComponent name="حالة القضية" type="text" value={hearingPayload.status} refState={(e: any) => setHearingPayload((p) => ({ ...p, status: e.target.value }))} />
        <TextInputComponent name="ملاحظات" type="text" value={hearingPayload.notes} refState={(e: any) => setHearingPayload((p) => ({ ...p, notes: e.target.value }))} />
      </ModalContainer>

      <ModalContainer
        modalState={verdictOpen}
        modalChangeState={() => setVerdictOpen(false)}
        modalTitle="إضافة حكم"
        modalSubtitle="تسجيل بيانات الحكم الصادر ومرفقاته"
        infoBanner="تأكد من صحة مدد الحبس والكفالة والغرامة قبل الحفظ النهائي."
        btnTitle="تسجيل"
        endIcon={<CheckOutlined />}
        modalAction={() => {
          const form = new FormData();
          const sentence = verdictPayload.sentence;
          if (sentence) {
            form.append('sentence_label', sentence.name);
            if (sentence.unit === 'month') {
              form.append('sentence_months', String(sentence.value));
              form.append('sentence_years', '0');
            } else {
              form.append('sentence_months', '0');
              form.append('sentence_years', '0');
            }
          }
          if (verdictPayload.bail_amount) form.append('bail_amount', verdictPayload.bail_amount);
          if (verdictPayload.fine_amount) form.append('fine_amount', verdictPayload.fine_amount);
          if (verdictPayload.expiry_date) form.append('expiry_date', verdictPayload.expiry_date);
          if (verdictPayload.notes) form.append('notes', verdictPayload.notes);
          if (verdictPayload.verdict_file) form.append('verdict_file', verdictPayload.verdict_file);
          addVerdict({ id, axiosdata: form });
          setVerdictOpen(false);
        }}
      >
        <AutocompleteComponent
          name="الحكم"
          value={verdictPayload.sentence}
          refState={(e: any) => setVerdictPayload((p) => ({ ...p, sentence: e }))}
          data={SENTENCE_OPTIONS}
        />
        <TextInputComponent name="الكفالة" type="number" value={verdictPayload.bail_amount} refState={(e: any) => setVerdictPayload((p) => ({ ...p, bail_amount: e.target.value }))} />
        <TextInputComponent name="الغرامة" type="number" value={verdictPayload.fine_amount} refState={(e: any) => setVerdictPayload((p) => ({ ...p, fine_amount: e.target.value }))} />
        <TextInputComponent name="إنقضاء الحكم" type="date" isDatePicker value={verdictPayload.expiry_date} refState={(e: any) => setVerdictPayload((p) => ({ ...p, expiry_date: e.target.value }))} />
        <TextInputComponent name="ملاحظات" type="text" value={verdictPayload.notes} refState={(e: any) => setVerdictPayload((p) => ({ ...p, notes: e.target.value }))} />
        <PDFUpload onFileSelect={(file) => setVerdictPayload((p) => ({ ...p, verdict_file: file }))} />
      </ModalContainer>

      <ModalContainer
        modalState={oppositionOpen}
        modalChangeState={() => setOppositionOpen(false)}
        modalTitle="إضافة معارضة"
        modalSubtitle="تسجيل بيانات المعارضة المرتبطة بالدعوى"
        btnTitle="تسجيل"
        endIcon={<CheckOutlined />}
        modalAction={() => {
          const form = new FormData();
          form.append('type', 'opposition');
          form.append('enumeration_number', oppositionPayload.enumeration_number);
          form.append('enumeration_year', oppositionPayload.enumeration_year);
          form.append('hearing_date', oppositionPayload.hearing_date);
          form.append('decision', oppositionPayload.decision);
          if (oppositionPayload.file) form.append('file', oppositionPayload.file);
          addOpposition({ id, axiosdata: form });
          setOppositionPayload({ ...emptyOppositionPayload, type: 'opposition' });
          setOppositionOpen(false);
        }}
      >
        <TextInputComponent name="رقم الحصر" type="text" value={oppositionPayload.enumeration_number} refState={(e: any) => setOppositionPayload((p) => ({ ...p, enumeration_number: e.target.value }))} />
        <TextInputComponent name="سنة الحصر" type="number" value={oppositionPayload.enumeration_year} refState={(e: any) => setOppositionPayload((p) => ({ ...p, enumeration_year: e.target.value }))} />
        <TextInputComponent name="تاريخ الجلسة" type="date" isDatePicker value={oppositionPayload.hearing_date} refState={(e: any) => setOppositionPayload((p) => ({ ...p, hearing_date: e.target.value }))} />
        <TextInputComponent name="القرار" type="text" value={oppositionPayload.decision} refState={(e: any) => setOppositionPayload((p) => ({ ...p, decision: e.target.value }))} />
        <PDFUpload onFileSelect={(file) => setOppositionPayload((p) => ({ ...p, file }))} />
      </ModalContainer>

      <ModalContainer
        modalState={appealOpen}
        modalChangeState={() => setAppealOpen(false)}
        modalTitle="إضافة استئناف"
        modalSubtitle="تسجيل بيانات التقرير بالاستئناف وإجراءاته"
        btnTitle="تسجيل"
        endIcon={<CheckOutlined />}
        modalAction={() => {
          const form = new FormData();
          Object.entries(appealPayload).forEach(([key, value]) => {
            if (value) form.append(key, value as any);
          });
          addAppeal({ id, axiosdata: form });
          setAppealOpen(false);
        }}
      >
        <TextInputComponent name="تاريخ التقرير بالاستئناف" type="date" isDatePicker value={appealPayload.appeal_date} refState={(e: any) => setAppealPayload((p) => ({ ...p, appeal_date: e.target.value }))} />
        <TextInputComponent name="رقم الاستئناف" type="text" value={appealPayload.appeal_number} refState={(e: any) => setAppealPayload((p) => ({ ...p, appeal_number: e.target.value }))} />
        <TextInputComponent name="السنة" type="number" value={appealPayload.appeal_year} refState={(e: any) => setAppealPayload((p) => ({ ...p, appeal_year: e.target.value }))} />
        <TextInputComponent name="المحكمة" type="text" value={appealPayload.court_name} refState={(e: any) => setAppealPayload((p) => ({ ...p, court_name: e.target.value }))} />
        <TextInputComponent name="الدائرة" type="text" value={appealPayload.circuit} refState={(e: any) => setAppealPayload((p) => ({ ...p, circuit: e.target.value }))} />
        <TextInputComponent name="تاريخ الجلسة" type="date" isDatePicker value={appealPayload.hearing_date} refState={(e: any) => setAppealPayload((p) => ({ ...p, hearing_date: e.target.value }))} />
        <TextInputComponent name="القرار" type="text" value={appealPayload.decision} refState={(e: any) => setAppealPayload((p) => ({ ...p, decision: e.target.value }))} />
        <TextInputComponent name="ملاحظات" type="text" value={appealPayload.notes} refState={(e: any) => setAppealPayload((p) => ({ ...p, notes: e.target.value }))} />
        <PDFUpload onFileSelect={(file) => setAppealPayload((p) => ({ ...p, file }))} />
      </ModalContainer>

      <ModalContainer
        modalState={appealOppositionOpen}
        modalChangeState={() => setAppealOppositionOpen(false)}
        modalTitle="إضافة معارضة استئنافية"
        modalSubtitle="تسجيل رقم وسنة الحصر والجلسة والقرار وصورة الحكم"
        btnTitle="تسجيل"
        endIcon={<CheckOutlined />}
        modalAction={() => {
          const form = new FormData();
          form.append('type', 'appeal_opposition');
          form.append('enumeration_number', appealOppositionPayload.enumeration_number);
          form.append('enumeration_year', appealOppositionPayload.enumeration_year);
          form.append('hearing_date', appealOppositionPayload.hearing_date);
          form.append('decision', appealOppositionPayload.decision);
          if (appealOppositionPayload.file) form.append('file', appealOppositionPayload.file);
          addOpposition({ id, axiosdata: form });
          setAppealOppositionPayload({ ...emptyOppositionPayload, type: 'appeal_opposition' });
          setAppealOppositionOpen(false);
        }}
      >
        <TextInputComponent name="رقم الحصر" type="text" value={appealOppositionPayload.enumeration_number} refState={(e: any) => setAppealOppositionPayload((p) => ({ ...p, enumeration_number: e.target.value }))} />
        <TextInputComponent name="سنة الحصر" type="number" value={appealOppositionPayload.enumeration_year} refState={(e: any) => setAppealOppositionPayload((p) => ({ ...p, enumeration_year: e.target.value }))} />
        <TextInputComponent name="تاريخ الجلسة" type="date" isDatePicker value={appealOppositionPayload.hearing_date} refState={(e: any) => setAppealOppositionPayload((p) => ({ ...p, hearing_date: e.target.value }))} />
        <TextInputComponent name="القرار" type="text" value={appealOppositionPayload.decision} refState={(e: any) => setAppealOppositionPayload((p) => ({ ...p, decision: e.target.value }))} />
        <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, mt: 0.5 }}>رفع صورة الحكم</Typography>
        <PDFUpload accept="application/pdf,image/*" onFileSelect={(file) => setAppealOppositionPayload((p) => ({ ...p, file }))} />
      </ModalContainer>

      <ModalContainer
        modalState={warningOpen}
        modalChangeState={() => setWarningOpen(false)}
        modalTitle="إضافة إنذار"
        modalSubtitle="تسجيل إنذار مرتبط بالعميل أو العقد"
        btnTitle="تسجيل"
        endIcon={<CheckOutlined />}
        modalAction={() => {
          const form = new FormData();
          form.append('client_id', String(client?.id || ''));
          form.append('contract_id', String(contract?.id || ''));
          form.append('target', warningPayload.target);
          form.append('warning_date', warningPayload.warning_date);
          form.append('notes', warningPayload.notes);
          if (warningPayload.file) form.append('file', warningPayload.file);
          addWarning(form);
        }}
      >
        <AutocompleteComponent
          name="على العميل أو العقد"
          value={warningTargets.find((item) => item.id === warningPayload.target) || warningTargets[0]}
          refState={(e: any) => setWarningPayload((p) => ({ ...p, target: e?.id || e }))}
          data={warningTargets}
        />
        <TextInputComponent name="تاريخ الإنذار" type="date" isDatePicker value={warningPayload.warning_date} refState={(e: any) => setWarningPayload((p) => ({ ...p, warning_date: e.target.value }))} />
        <TextInputComponent name="ملاحظات" type="text" value={warningPayload.notes} refState={(e: any) => setWarningPayload((p) => ({ ...p, notes: e.target.value }))} />
        <PDFUpload onFileSelect={(file) => setWarningPayload((p) => ({ ...p, file }))} />
      </ModalContainer>
      </Box>
    </DashboardContent>
  );
}
