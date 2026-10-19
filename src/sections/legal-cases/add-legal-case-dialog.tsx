import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { CheckOutlined } from '@mui/icons-material';
import { toast } from 'sonner';

import { Iconify } from 'src/components/iconify';
import { PDFUpload } from 'src/components/file-upload/pdf-upload';
import TextInputComponent from 'src/components/utils/TextInputComponent';
import AutocompleteComponent from 'src/components/utils/AutoCompleteComponent';
import { AppDialog } from 'src/components/utils/AppDialog';
import { useGetCompanyAccounts, useGetLookups } from 'src/hooks/customHooks';
import { ClientSelectOrCreate, type ClientOption } from 'src/sections/civil-cases/client-select-or-create';

export type HearingPayload = {
  hearing_date: string;
  status: string;
  notes: string;
};

export type PartyTypeOption = { id: string; name: string };

export const PARTY_TYPES: PartyTypeOption[] = [
  { id: 'company', name: 'الشركة' },
  { id: 'client', name: 'العميل' },
];

export type LegalCasePayload = {
  party_type: PartyTypeOption;
  client_id: string;
  client_app_id: string;
  client_number: string;
  full_name: string;
  full_name_en: string;
  mobile: string;
  phone_1: string;
  phone_2: string;
  office_phone: string;
  national_id: string;
  dob: string;
  company_name: string;
  work_office: string;
  home_address: string;
  work_address: string;
  request_date: string;
  contract_number: string;
  loan_type: string;
  package: string;
  branch_name: string;
  price: string;
  downpayment_percent: string;
  downpayment_value: string;
  loan_amount: string;
  tenor_months: string;
  interest_rate: string;
  monthly_payment: string;
  case_code: string;
  case_number: string;
  case_year: string;
  case_date: string;
  check_number: string;
  check_due_date: string;
  status_date: string;
  governorate: string;
  police_station: string;
  court_name: string;
  case_type: { id: number; name: string } | string;
  circuit: string;
  notes: string;
  hearings: HearingPayload[];
  gon7a: File | null;
};

export const emptyHearing = (): HearingPayload => ({
  hearing_date: '',
  status: '',
  notes: '',
});

const CASE_TYPES = [
  { id: 1, name: 'مباشرة' },
  { id: 2, name: 'قسم' },
];

type AddLegalCaseDialogProps = {
  open: boolean;
  title: string;
  payload: LegalCasePayload;
  setPayload: Dispatch<SetStateAction<LegalCasePayload>>;
  onClose: () => void;
  onSubmit: () => void;
};

const STEPS = [
  { id: 1, label: 'بيانات الدعوى والمحكمة' },
  { id: 2, label: 'المستندات والتوكيلات' },
] as const;

const DRAFT_KEY = 'legal_case_add_draft';

const updatePayload =
  (setPayload: Dispatch<SetStateAction<LegalCasePayload>>, key: keyof LegalCasePayload) =>
  (e: any) =>
    setPayload((prev) => ({ ...prev, [key]: e.target.value }));

function FieldHint({ children }: { children: string }) {
  return (
    <Typography sx={{ mt: -1.25, mb: 1.5, fontSize: 11.5, color: 'text.secondary', fontWeight: 500, px: 0.25 }}>
      {children}
    </Typography>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 0.5 }}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1.5,
          bgcolor: 'rgba(26,41,66,0.08)',
          display: 'grid',
          placeItems: 'center',
          color: 'primary.main',
        }}
      >
        <Iconify icon={icon} width={16} />
      </Box>
      <Typography sx={{ fontWeight: 800, fontSize: 15, color: 'primary.main' }}>{title}</Typography>
    </Box>
  );
}

function lookupName(value: any) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.name || '';
}

export function AddLegalCaseDialog({
  open,
  title,
  payload,
  setPayload,
  onClose,
  onSubmit,
}: AddLegalCaseDialogProps) {
  const [step, setStep] = useState(1);
  const { data: lookupsResponse } = useGetLookups({ key: 'GetLookups_API_AddCase' });
  const { data: companiesResponse } = useGetCompanyAccounts({ key: 'GetCompanyAccounts_API_AddCase' });
  const lookups = lookupsResponse?.data?.data || [];
  const companies = companiesResponse?.data?.data || [];

  const selectedGov = useMemo(
    () => lookups.find((item: any) => item.type === 'governorate' && item.name === payload.governorate),
    [lookups, payload.governorate]
  );
  const selectedStation = useMemo(
    () =>
      lookups.find(
        (item: any) =>
          item.type === 'police_station' &&
          item.name === payload.police_station &&
          (!selectedGov || item.parent_id === selectedGov.id)
      ),
    [lookups, payload.police_station, selectedGov]
  );
  const governorateOptions = useMemo(
    () => lookups.filter((item: any) => item.type === 'governorate'),
    [lookups]
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
  const courtOptions = useMemo(
    () => lookups.filter((item: any) => item.type === 'court'),
    [lookups]
  );

  useEffect(() => {
    if (!open) return;
    setStep(1);
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      const { saved_at, gon7a_name: _gon7aName, ...rest } = draft;
      const hasContent = Boolean(
        rest.case_number ||
          rest.full_name ||
          rest.contract_number ||
          rest.court_name ||
          rest.check_number ||
          (Array.isArray(rest.hearings) && rest.hearings.length)
      );
      if (!hasContent) return;
      setPayload((prev) => ({
        ...prev,
        ...rest,
        gon7a: null,
        hearings: Array.isArray(rest.hearings) ? rest.hearings : prev.hearings,
      }));
      toast.message(
        saved_at
          ? `تم استعادة المسودة المحفوظة (${new Date(saved_at).toLocaleString('ar-EG')})`
          : 'تم استعادة المسودة المحفوظة'
      );
    } catch {
      // ignore corrupt draft
    }
    // Restore once when dialog opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => {
      try {
        const { gon7a, ...rest } = payload;
        sessionStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            ...rest,
            gon7a_name: gon7a?.name || null,
            saved_at: new Date().toISOString(),
          })
        );
      } catch {
        // ignore draft persistence errors
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [open, payload]);

  const handleSaveDraft = () => {
    try {
      const { gon7a, ...rest } = payload;
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          ...rest,
          gon7a_name: gon7a?.name || null,
          saved_at: new Date().toISOString(),
        })
      );
      toast.success('تم حفظ المسودة على هذا الجهاز. ستُستعاد عند فتح الإضافة مرة أخرى.');
      onClose();
    } catch {
      toast.error('تعذر حفظ المسودة');
    }
  };

  const handleNext = () => setStep((prev) => Math.min(2, prev + 1));
  const handleBack = () => setStep((prev) => Math.max(1, prev - 1));

  const partyType =
    PARTY_TYPES.find((item) => item.id === (payload.party_type?.id || payload.party_type)) ||
    PARTY_TYPES[1];
  const isCompanyParty = partyType.id === 'company';
  const selectedClient: ClientOption | null = payload.client_id
    ? {
        id: payload.client_id,
        name: payload.full_name || '',
        full_name: payload.full_name,
        mobile: payload.mobile,
      }
    : null;

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={title}
      subtitle="تسجيل بيانات الطرف والعقد وربطها برقم الملف القضائي"
      statusChip="قيد التسجيل"
      maxWidth="md"
      paperSx={{ maxWidth: 920 }}
      infoBanner="ملاحظة تنظيمية: يرجى التأكد من اختيار الطرف (شركة / عميل) وبيانات العقد والدعوى قبل التسجيل النهائي."
      showCancel
      cancelLabel="إلغاء الأمر"
      secondaryLabel="حفظ كمسودة"
      onSecondary={handleSaveDraft}
      primaryLabel={step < 2 ? 'التالي' : 'تسجيل ومتابعة الدعوى'}
      onPrimary={step < 2 ? handleNext : onSubmit}
      primaryEndIcon={step < 2 ? undefined : <CheckOutlined />}
      footerExtra={
        step > 1 ? (
          <Button variant="outlined" color="primary" onClick={handleBack} sx={{ borderRadius: 2, fontWeight: 700 }}>
            السابق
          </Button>
        ) : null
      }
      toolbar={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
            {STEPS.map((item, index) => {
              const active = item.id === step;
              const done = item.id < step;
              return (
                <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {index > 0 && (
                    <Box sx={{ width: 28, height: 2, bgcolor: done || active ? 'primary.main' : 'grey.300', borderRadius: 1 }} />
                  )}
                  <Box
                    onClick={() => setStep(item.id)}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.85,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 12,
                        fontWeight: 800,
                        bgcolor: active || done ? 'primary.main' : 'grey.200',
                        color: active || done ? '#fff' : 'text.secondary',
                      }}
                    >
                      {done ? <Iconify icon="mdi:check" width={14} /> : item.id}
                    </Box>
                    <Typography
                      sx={{
                        fontSize: 12.5,
                        fontWeight: active ? 800 : 600,
                        color: active ? 'primary.main' : 'text.secondary',
                      }}
                    >
                      {item.label}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22C55E' }} />
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
              حفظ مسودة تلقائي مفعل
            </Typography>
          </Box>
        </Box>
      }
    >
      {step === 1 && (
        <>
          <SectionTitle icon="solar:users-group-rounded-bold-duotone" title="الطرف" />
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <AutocompleteComponent
                name="اختار من"
                value={partyType}
                refState={(e: any) =>
                  setPayload((prev) => ({
                    ...prev,
                    party_type: e || PARTY_TYPES[1],
                    client_id: e?.id === 'company' ? '' : prev.client_id,
                  }))
                }
                data={PARTY_TYPES}
              />
              <FieldHint>اختر نوع الطرف: شركة أو عميل</FieldHint>
            </Grid>
            {isCompanyParty ? (
              <Grid item xs={12} md={8}>
                <AutocompleteComponent
                  name="الشركة"
                  value={companies.find((item: any) => item.name === payload.branch_name) || null}
                  refState={(e: any) =>
                    setPayload((prev) => ({
                      ...prev,
                      branch_name: lookupName(e),
                      company_name: lookupName(e) || prev.company_name,
                      full_name: lookupName(e) || prev.full_name,
                      client_id: '',
                    }))
                  }
                  data={companies}
                />
                <FieldHint>قائمة حسابات الشركات التي أنشأها المدير</FieldHint>
              </Grid>
            ) : (
              <ClientSelectOrCreate
                value={selectedClient}
                onChange={(e) =>
                  setPayload((prev) => ({
                    ...prev,
                    client_id: e?.id != null ? String(e.id) : '',
                    full_name: e?.name || e?.full_name || '',
                    mobile: e?.mobile || prev.mobile,
                  }))
                }
              />
            )}
          </Grid>

          <Box sx={{ my: 2.5, borderTop: '1px solid', borderColor: 'grey.200' }} />

          <SectionTitle icon="solar:document-text-bold-duotone" title="بيانات العقد والتمويل المرتبطة" />
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextInputComponent name="رقم العقد" type="text" value={payload.contract_number} refState={updatePayload(setPayload, 'contract_number')} />
              <FieldHint>الرقم القانوني للعقد</FieldHint>
            </Grid>
            {!isCompanyParty && (
              <Grid item xs={12} md={4}>
                <AutocompleteComponent
                  name="الفرع / الشركة"
                  value={companies.find((item: any) => item.name === payload.branch_name) || null}
                  refState={(e: any) =>
                    setPayload((prev) => ({
                      ...prev,
                      branch_name: lookupName(e),
                    }))
                  }
                  data={companies}
                />
                <FieldHint>قائمة حسابات الشركات التي أنشأها المدير</FieldHint>
              </Grid>
            )}
            <Grid item xs={12} md={4}>
              <TextInputComponent name="تاريخ الطلب" type="date" isDatePicker value={payload.request_date} refState={updatePayload(setPayload, 'request_date')} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextInputComponent name="نوع التمويل" type="text" value={payload.loan_type} refState={updatePayload(setPayload, 'loan_type')} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextInputComponent name="الباقة" type="text" value={payload.package} refState={updatePayload(setPayload, 'package')} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextInputComponent name="السعر" type="number" value={payload.price} refState={updatePayload(setPayload, 'price')} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextInputComponent name="نسبة المقدم %" type="number" value={payload.downpayment_percent} refState={updatePayload(setPayload, 'downpayment_percent')} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextInputComponent name="قيمة المقدم" type="number" value={payload.downpayment_value} refState={updatePayload(setPayload, 'downpayment_value')} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextInputComponent name="إجمالي مبلغ التمويل" type="number" value={payload.loan_amount} refState={updatePayload(setPayload, 'loan_amount')} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextInputComponent name="مدة السداد بالشهور" type="number" value={payload.tenor_months} refState={updatePayload(setPayload, 'tenor_months')} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextInputComponent name="العائد %" type="number" value={payload.interest_rate} refState={updatePayload(setPayload, 'interest_rate')} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextInputComponent name="القسط الشهري" type="number" value={payload.monthly_payment} refState={updatePayload(setPayload, 'monthly_payment')} />
            </Grid>
          </Grid>

          <Box sx={{ my: 2.5, borderTop: '1px solid', borderColor: 'grey.200' }} />

          <SectionTitle icon="solar:card-bold-duotone" title="بيانات الشيك" />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextInputComponent
                name="رقم الشيك"
                type="text"
                value={payload.check_number}
                refState={updatePayload(setPayload, 'check_number')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextInputComponent
                name="تاريخ الاستحقاق"
                type="date"
                isDatePicker
                value={payload.check_due_date}
                refState={updatePayload(setPayload, 'check_due_date')}
              />
            </Grid>
          </Grid>

          <Box sx={{ my: 2.5, borderTop: '1px solid', borderColor: 'grey.200' }} />

          <SectionTitle icon="solar:buildings-2-bold-duotone" title="بيانات الدعوى والمحكمة المختصة" />
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextInputComponent name="رقم القضية" type="text" value={payload.case_number} refState={updatePayload(setPayload, 'case_number')} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextInputComponent name="سنة القضية" type="number" value={payload.case_year} refState={updatePayload(setPayload, 'case_year')} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextInputComponent name="تاريخ القضية" type="date" isDatePicker value={payload.case_date} refState={updatePayload(setPayload, 'case_date')} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextInputComponent name="تاريخ المحضر" type="date" isDatePicker value={payload.status_date} refState={updatePayload(setPayload, 'status_date')} />
            </Grid>
            <Grid item xs={12} md={4}>
              <AutocompleteComponent
                name="المحكمة"
                value={courtOptions.find((item: any) => item.name === payload.court_name) || null}
                refState={(e: any) => setPayload((prev) => ({ ...prev, court_name: lookupName(e) }))}
                data={courtOptions}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AutocompleteComponent
                name="النوع"
                value={typeof payload.case_type === 'string' ? CASE_TYPES.find((t) => t.name === payload.case_type) || CASE_TYPES[0] : payload.case_type || CASE_TYPES[0]}
                refState={(e: any) => setPayload((prev) => ({ ...prev, case_type: e }))}
                data={CASE_TYPES}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AutocompleteComponent
                name="المحافظة"
                value={selectedGov || null}
                refState={(e: any) =>
                  setPayload((prev) => ({
                    ...prev,
                    governorate: lookupName(e),
                    police_station: '',
                    circuit: '',
                  }))
                }
                data={governorateOptions}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AutocompleteComponent
                name="القسم"
                value={selectedStation || null}
                refState={(e: any) =>
                  setPayload((prev) => ({
                    ...prev,
                    police_station: lookupName(e),
                    circuit: '',
                  }))
                }
                data={stationOptions}
              />
              <FieldHint>يظهر أقسام المحافظة المختارة فقط</FieldHint>
            </Grid>
            <Grid item xs={12} md={4}>
              <AutocompleteComponent
                name="الدائرة"
                value={circuitOptions.find((item: any) => item.name === payload.circuit) || null}
                refState={(e: any) => setPayload((prev) => ({ ...prev, circuit: lookupName(e) }))}
                data={circuitOptions}
              />
              <FieldHint>تظهر دوائر القسم المختار فقط</FieldHint>
            </Grid>
          </Grid>

          <Box sx={{ my: 2.5, borderTop: '1px solid', borderColor: 'grey.200' }} />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
            <SectionTitle icon="solar:calendar-bold-duotone" title="الجلسات" />
            <Button
              size="small"
              variant="outlined"
              startIcon={<Iconify icon="mingcute:add-line" width={16} />}
              onClick={() =>
                setPayload((prev) => ({
                  ...prev,
                  hearings: [...(prev.hearings || []), emptyHearing()],
                }))
              }
              sx={{ fontWeight: 800, borderRadius: 2, mb: 1 }}
            >
              إضافة جلسة
            </Button>
          </Box>

          {(payload.hearings || []).length === 0 ? (
            <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 600, mb: 2 }}>
              لم تُضف جلسات بعد. استخدم زر «إضافة جلسة» لتسجيل جلسة أو أكثر.
            </Typography>
          ) : (
            (payload.hearings || []).map((hearing, index) => (
              <Box
                key={`hearing-${index}`}
                sx={{
                  mb: 2,
                  p: 2,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'grey.200',
                  bgcolor: '#F8FAFC',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: 'primary.main' }}>
                    جلسة {index + 1}
                  </Typography>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() =>
                      setPayload((prev) => ({
                        ...prev,
                        hearings: prev.hearings.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                  </IconButton>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextInputComponent
                      name="تاريخ الجلسة"
                      type="date"
                      isDatePicker
                      value={hearing.hearing_date}
                      refState={(e: any) =>
                        setPayload((prev) => {
                          const hearings = [...prev.hearings];
                          hearings[index] = { ...hearings[index], hearing_date: e.target.value };
                          return { ...prev, hearings };
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextInputComponent
                      name="حالة القضية"
                      type="text"
                      value={hearing.status}
                      refState={(e: any) =>
                        setPayload((prev) => {
                          const hearings = [...prev.hearings];
                          hearings[index] = { ...hearings[index], status: e.target.value };
                          return { ...prev, hearings };
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextInputComponent
                      name="ملاحظات الجلسة"
                      type="text"
                      value={hearing.notes}
                      refState={(e: any) =>
                        setPayload((prev) => {
                          const hearings = [...prev.hearings];
                          hearings[index] = { ...hearings[index], notes: e.target.value };
                          return { ...prev, hearings };
                        })
                      }
                    />
                  </Grid>
                </Grid>
              </Box>
            ))
          )}

          <TextInputComponent
            name="ملاحظات"
            type="text"
            value={payload.notes}
            refState={updatePayload(setPayload, 'notes')}
          />
          <FieldHint>ملاحظات عامة تظهر لجميع المستخدمين على الجنحة.</FieldHint>
        </>
      )}

      {step === 2 && (
        <>
          <SectionTitle icon="solar:folder-with-files-bold-duotone" title="المستندات والتوكيلات" />
          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              border: '1px dashed',
              borderColor: 'grey.300',
              bgcolor: '#FBFCFD',
            }}
          >
            <Typography sx={{ fontWeight: 700, mb: 0.75, fontSize: 14 }}>ملف الجنحة / المستند الأساسي</Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 2, fontWeight: 500 }}>
              ارفع ملف PDF أو صورة للجنحة. يمكن التوقيع إلكترونياً بعد التسجيل إن وُجد ملف مرفق.
            </Typography>
            <PDFUpload
              accept="application/pdf,image/*"
              selectedFileName={payload.gon7a?.name || null}
              onFileSelect={(file) => setPayload((prev) => ({ ...prev, gon7a: file }))}
            />
          </Box>
        </>
      )}
    </AppDialog>
  );
}
