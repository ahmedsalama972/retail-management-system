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
import { SENTENCE_OPTIONS } from 'src/sections/legal-cases/sentence-options';
import { ClientSelectOrCreate } from './client-select-or-create';
import { emptyHearing, PARTY_TYPES, type CivilCasePayload, type CivilHearingPayload } from './civil-types';

type Props = {
  open: boolean;
  title?: string;
  payload: CivilCasePayload;
  setPayload: Dispatch<SetStateAction<CivilCasePayload>>;
  onClose: () => void;
  onSubmit: () => void;
};

const STEPS = [
  { id: 1, label: 'بيانات الدعوى والمحكمة' },
  { id: 2, label: 'المستندات والتوكيلات' },
] as const;

const DRAFT_KEY = 'civil_case_add_draft';

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

function HearingsBlock({
  hearings,
  onChange,
}: {
  hearings: CivilHearingPayload[];
  onChange: (next: CivilHearingPayload[]) => void;
}) {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
        <SectionTitle icon="solar:calendar-bold-duotone" title="الجلسات" />
        <Button
          size="small"
          variant="outlined"
          startIcon={<Iconify icon="mingcute:add-line" width={16} />}
          onClick={() => onChange([...(hearings || []), emptyHearing()])}
          sx={{ fontWeight: 800, borderRadius: 2, mb: 1 }}
        >
          إضافة جلسة
        </Button>
      </Box>

      {(hearings || []).length === 0 ? (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 600, mb: 2 }}>
          لم تُضف جلسات بعد. استخدم زر «إضافة جلسة» لتسجيل جلسة أو أكثر.
        </Typography>
      ) : (
        (hearings || []).map((hearing, index) => (
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
                onClick={() => onChange(hearings.filter((_, i) => i !== index))}
              >
                <Iconify icon="solar:trash-bin-trash-bold" width={18} />
              </IconButton>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextInputComponent
                  name="الجلسة"
                  type="date"
                  isDatePicker
                  value={hearing.hearing_date}
                  refState={(e: any) => {
                    const next = [...hearings];
                    next[index] = { ...next[index], hearing_date: e.target.value };
                    onChange(next);
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextInputComponent
                  name="القرار"
                  type="text"
                  value={hearing.decision}
                  refState={(e: any) => {
                    const next = [...hearings];
                    next[index] = { ...next[index], decision: e.target.value };
                    onChange(next);
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextInputComponent
                  name="ملاحظات الجلسة"
                  type="text"
                  value={hearing.notes}
                  refState={(e: any) => {
                    const next = [...hearings];
                    next[index] = { ...next[index], notes: e.target.value };
                    onChange(next);
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        ))
      )}
    </>
  );
}

export function AddCivilCaseDialog({
  open,
  title = 'إضافة دعوى مدنية',
  payload,
  setPayload,
  onClose,
  onSubmit,
}: Props) {
  const [step, setStep] = useState(1);
  const { data: companiesRes } = useGetCompanyAccounts({ key: 'GetCompanyAccounts_Civil' });
  const { data: lookupsRes } = useGetLookups({ key: 'GetLookups_Civil' });

  const companies = companiesRes?.data?.data || [];
  const lookups = lookupsRes?.data?.data || [];
  const courtOptions = useMemo(() => lookups.filter((i: any) => i.type === 'court'), [lookups]);
  const circuitOptions = useMemo(() => lookups.filter((i: any) => i.type === 'circuit'), [lookups]);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      const { saved_at, document_name: _documentName, ...rest } = draft;
      const hasContent = Boolean(
        rest.case_number ||
          rest.company_name ||
          rest.court_name ||
          rest.filing_date ||
          rest.client_id ||
          (Array.isArray(rest.hearings) && rest.hearings.length)
      );
      if (!hasContent) return;
      setPayload((prev) => ({
        ...prev,
        ...rest,
        document: null,
        hearings: Array.isArray(rest.hearings) ? rest.hearings : prev.hearings,
        appeal_hearings: Array.isArray(rest.appeal_hearings) ? rest.appeal_hearings : prev.appeal_hearings,
      }));
      toast.message(
        saved_at
          ? `تم استعادة المسودة المحفوظة (${new Date(saved_at).toLocaleString('ar-EG')})`
          : 'تم استعادة المسودة المحفوظة'
      );
    } catch {
      // ignore corrupt draft
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => {
      try {
        const { document: _doc, ...rest } = payload;
        sessionStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            ...rest,
            document_name: payload.document?.name || null,
            saved_at: new Date().toISOString(),
          })
        );
      } catch {
        // ignore
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [open, payload]);

  const handleSaveDraft = () => {
    try {
      const { document: _doc, ...rest } = payload;
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          ...rest,
          document_name: payload.document?.name || null,
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

  const mainIsCompany = (payload.party_type?.id || payload.party_type) === 'company';
  const mainPartyLabel = mainIsCompany
    ? payload.company_name || payload.party?.name || '—'
    : payload.party?.name || payload.party?.full_name || '—';

  // Appeal uses the same party chosen at the start of the form
  useEffect(() => {
    const nextCompany = mainIsCompany ? payload.company_name || payload.party?.name || '' : '';
    const nextClientId = mainIsCompany
      ? ''
      : payload.client_id || (payload.party?.id != null ? String(payload.party.id) : '');
    setPayload((p) => {
      if (
        (p.appeal_party_type?.id || p.appeal_party_type) === (p.party_type?.id || p.party_type) &&
        p.appeal_company_name === nextCompany &&
        String(p.appeal_client_id || '') === String(nextClientId || '')
      ) {
        return p;
      }
      return {
        ...p,
        appeal_party_type: p.party_type,
        appeal_party: p.party,
        appeal_company_name: nextCompany,
        appeal_client_id: nextClientId,
      };
    });
  }, [
    mainIsCompany,
    payload.party_type,
    payload.company_name,
    payload.client_id,
    payload.party?.id,
    payload.party?.name,
    payload.party?.full_name,
    setPayload,
  ]);

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={title}
      subtitle="تسجيل بيانات الدعوى المدنية ثم رفع المستندات والتوكيلات"
      statusChip="قيد التسجيل"
      maxWidth="md"
      paperSx={{ maxWidth: 920 }}
      infoBanner="ملاحظة تنظيمية: يرجى التأكد من اختيار الطرف (شركة / عميل) وبيانات المحكمة ورقم الدعوى قبل التسجيل النهائي."
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
                    <Box
                      sx={{
                        width: 28,
                        height: 2,
                        bgcolor: done || active ? 'primary.main' : 'grey.300',
                        borderRadius: 1,
                      }}
                    />
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
          <SectionTitle icon="solar:users-group-rounded-bold-duotone" title="الطرف والدعوى المدنية" />
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <AutocompleteComponent
                name="اختار من"
                value={payload.party_type}
                refState={(e: any) =>
                  setPayload((p) => ({ ...p, party_type: e || PARTY_TYPES[0], party: null }))
                }
                data={PARTY_TYPES}
              />
              <FieldHint>اختر نوع الطرف: شركة أو عميل</FieldHint>
            </Grid>
            {mainIsCompany ? (
              <Grid item xs={12} md={8}>
                <AutocompleteComponent
                  name="الشركة"
                  value={payload.party}
                  refState={(e: any) =>
                    setPayload((p) => ({
                      ...p,
                      party: e,
                      company_name: lookupName(e),
                      client_id: '',
                    }))
                  }
                  data={companies}
                />
                <FieldHint>قائمة حسابات الشركات التي أنشأها المدير</FieldHint>
              </Grid>
            ) : (
              <ClientSelectOrCreate
                value={payload.party}
                onChange={(e) =>
                  setPayload((p) => ({
                    ...p,
                    party: e,
                    company_name: '',
                    client_id: e?.id != null ? String(e.id) : '',
                  }))
                }
              />
            )}
            <Grid item xs={12} md={4}>
              <TextInputComponent
                name="تاريخ إقامة الدعوى"
                type="date"
                isDatePicker
                value={payload.filing_date}
                refState={(e: any) => setPayload((p) => ({ ...p, filing_date: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AutocompleteComponent
                name="المحكمة"
                value={courtOptions.find((c: any) => c.name === payload.court_name) || null}
                refState={(e: any) => setPayload((p) => ({ ...p, court_name: lookupName(e) }))}
                data={courtOptions}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextInputComponent
                name="رقم الدعوى"
                type="text"
                value={payload.case_number}
                refState={(e: any) => setPayload((p) => ({ ...p, case_number: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextInputComponent
                name="السنة"
                type="number"
                value={payload.case_year}
                refState={(e: any) => setPayload((p) => ({ ...p, case_year: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AutocompleteComponent
                name="الدائرة"
                value={circuitOptions.find((c: any) => c.name === payload.circuit) || null}
                refState={(e: any) => setPayload((p) => ({ ...p, circuit: lookupName(e) }))}
                data={circuitOptions}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AutocompleteComponent
                name="الحكم"
                value={payload.judgment}
                refState={(e: any) => setPayload((p) => ({ ...p, judgment: e }))}
                data={SENTENCE_OPTIONS}
              />
            </Grid>
            <Grid item xs={12}>
              <TextInputComponent
                name="ملاحظات"
                type="text"
                value={payload.notes}
                refState={(e: any) => setPayload((p) => ({ ...p, notes: e.target.value }))}
              />
              <FieldHint>ملاحظات عامة تظهر على الدعوى المدنية.</FieldHint>
            </Grid>
          </Grid>

          <Box sx={{ my: 2.5, borderTop: '1px solid', borderColor: 'grey.200' }} />
          <HearingsBlock
            hearings={payload.hearings}
            onChange={(hearings) => setPayload((p) => ({ ...p, hearings }))}
          />

          <Box sx={{ my: 2.5, borderTop: '1px solid', borderColor: 'grey.200' }} />
          <SectionTitle icon="solar:notebook-bold-duotone" title="التقرير بالاستئناف (اختياري)" />
          <Typography sx={{ mb: 2, mt: -0.5, fontSize: 12.5, fontWeight: 600, color: 'text.secondary' }}>
            الطرف: {mainIsCompany ? 'شركة' : 'عميل'} — {mainPartyLabel}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextInputComponent
                name="تاريخ الاستئناف"
                type="date"
                isDatePicker
                value={payload.appeal_date}
                refState={(e: any) => setPayload((p) => ({ ...p, appeal_date: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AutocompleteComponent
                name="المحكمة"
                value={courtOptions.find((c: any) => c.name === payload.appeal_court_name) || null}
                refState={(e: any) => setPayload((p) => ({ ...p, appeal_court_name: lookupName(e) }))}
                data={courtOptions}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextInputComponent
                name="رقم الاستئناف"
                type="text"
                value={payload.appeal_number}
                refState={(e: any) => setPayload((p) => ({ ...p, appeal_number: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextInputComponent
                name="السنة"
                type="number"
                value={payload.appeal_year}
                refState={(e: any) => setPayload((p) => ({ ...p, appeal_year: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AutocompleteComponent
                name="الدائرة"
                value={circuitOptions.find((c: any) => c.name === payload.appeal_circuit) || null}
                refState={(e: any) => setPayload((p) => ({ ...p, appeal_circuit: lookupName(e) }))}
                data={circuitOptions}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AutocompleteComponent
                name="الحكم"
                value={payload.appeal_judgment}
                refState={(e: any) => setPayload((p) => ({ ...p, appeal_judgment: e }))}
                data={SENTENCE_OPTIONS}
              />
            </Grid>
            <Grid item xs={12}>
              <TextInputComponent
                name="ملاحظات"
                type="text"
                value={payload.appeal_notes}
                refState={(e: any) => setPayload((p) => ({ ...p, appeal_notes: e.target.value }))}
              />
              <FieldHint>ملاحظات عامة للتقرير بالاستئناف.</FieldHint>
            </Grid>
          </Grid>

          <Box sx={{ my: 2.5, borderTop: '1px solid', borderColor: 'grey.200' }} />
          <HearingsBlock
            hearings={payload.appeal_hearings}
            onChange={(appeal_hearings) => setPayload((p) => ({ ...p, appeal_hearings }))}
          />
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
            <Typography sx={{ fontWeight: 700, mb: 0.75, fontSize: 14 }}>
              ملف الدعوى / المستند الأساسي
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 2, fontWeight: 500 }}>
              ارفع ملف PDF أو صورة للدعوى المدنية. يمكن التوقيع إلكترونياً بعد التسجيل إن وُجد ملف مرفق.
            </Typography>
            <PDFUpload
              accept="application/pdf,image/*"
              selectedFileName={payload.document?.name || null}
              onFileSelect={(file) => setPayload((prev) => ({ ...prev, document: file }))}
            />
          </Box>
        </>
      )}
    </AppDialog>
  );
}
