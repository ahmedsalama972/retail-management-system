import { useMemo, useState, type ReactNode } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import { CheckOutlined } from '@mui/icons-material';
import { Toaster } from 'sonner';

import { DashboardContent } from 'src/layouts/dashboard';
import { CircularLoader } from 'src/utils/CircularLoader';
import { Iconify } from 'src/components/iconify';
import TextInputComponent from 'src/components/utils/TextInputComponent';
import AutocompleteComponent from 'src/components/utils/AutoCompleteComponent';
import ModalContainer from 'src/components/utils/ModalContainer';
import {
  useAddCivilHearingMutation,
  useEditCivilCaseMutation,
  useGetCivilCase,
  useGetCompanyAccounts,
  useGetLookups,
  useUpsertCivilAppealMutation,
} from 'src/hooks/customHooks';
import { formatDate } from 'src/sections/legal-cases/utils';
import { SENTENCE_OPTIONS } from 'src/sections/legal-cases/sentence-options';
import { PdfFileCell } from 'src/components/utils/PdfFileCell';
import { PDFUpload } from 'src/components/file-upload/pdf-upload';
import { ClientSelectOrCreate } from '../client-select-or-create';
import { PARTY_TYPES } from '../civil-types';

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card
      sx={{
        mb: 2.5,
        p: 2.5,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'grey.200',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 1 }}>
        <Typography sx={{ fontWeight: 800, color: 'primary.main' }}>{title}</Typography>
        {action}
      </Box>
      {children}
    </Card>
  );
}

function HearingList({ items }: { items: any[] }) {
  if (!items?.length) {
    return (
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
        لا توجد جلسات مسجّلة
      </Typography>
    );
  }
  return (
    <Box>
      {items.map((item) => (
        <Box
          key={item.id}
          sx={{
            mb: 1.25,
            p: 1.5,
            borderRadius: 2,
            bgcolor: '#F8FAFC',
            border: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: 13, mb: 0.5 }}>
            {formatDate(item.hearing_date) || 'جلسة'}
          </Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
            القرار: {item.decision || '—'}
          </Typography>
          {item.notes ? (
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.5 }}>
              ملاحظات: {item.notes}
            </Typography>
          ) : null}
        </Box>
      ))}
    </Box>
  );
}

export function CivilCaseDetailsView() {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [hearingOpen, setHearingOpen] = useState(false);
  const [hearingPhase, setHearingPhase] = useState<'main' | 'appeal'>('main');
  const [hearingPayload, setHearingPayload] = useState({
    hearing_date: '',
    decision: '',
    notes: '',
  });
  const [mainDraft, setMainDraft] = useState<any>({});
  const [appealDraft, setAppealDraft] = useState<any>({});
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const { data, refetch } = useGetCivilCase({ key: 'GetCivilCase_API', id, setIsLoading });
  const civilCase = data?.data?.data;
  const { data: companiesRes } = useGetCompanyAccounts({ key: 'GetCompanyAccounts_CivilDetails' });
  const { data: lookupsRes } = useGetLookups({ key: 'GetLookups_CivilDetails' });
  const { mutate: saveCase } = useEditCivilCaseMutation({ setIsLoading, refetch });
  const { mutate: saveAppeal } = useUpsertCivilAppealMutation({ setIsLoading, refetch });
  const { mutate: addHearing } = useAddCivilHearingMutation({ setIsLoading, refetch });

  const companies = companiesRes?.data?.data || [];
  const lookups = lookupsRes?.data?.data || [];
  const courts = useMemo(() => lookups.filter((i: any) => i.type === 'court'), [lookups]);
  const circuits = useMemo(() => lookups.filter((i: any) => i.type === 'circuit'), [lookups]);

  const merged = useMemo(() => ({ ...civilCase, ...mainDraft }), [civilCase, mainDraft]);
  const appealMerged = useMemo(
    () => ({ ...(civilCase?.appeal || {}), ...appealDraft }),
    [civilCase, appealDraft]
  );

  if (!civilCase) {
    return (
      <DashboardContent>
        {isLoading && <CircularLoader />}
        <Typography sx={{ fontWeight: 700 }}>جاري التحميل...</Typography>
      </DashboardContent>
    );
  }

  const mainPartyType =
    PARTY_TYPES.find((t) => t.id === (merged.party_type || 'company')) || PARTY_TYPES[0];
  const mainPartyValue =
    mainPartyType.id === 'company'
      ? companies.find((c: any) => c.name === merged.company_name) || null
      : merged.client_id
        ? {
            id: merged.client_id,
            name: merged.client?.full_name || merged.party_label || '',
            full_name: merged.client?.full_name,
          }
        : null;

  return (
    <DashboardContent>
      {isLoading && <CircularLoader />}
      <Toaster richColors expand={false} duration={4000} />

      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/civil-cases" underline="hover" color="inherit" sx={{ fontWeight: 700 }}>
          المدني
        </Link>
        <Typography sx={{ fontWeight: 800, color: 'primary.main' }}>
          {merged.case_number || merged.case_code || id}
        </Typography>
      </Breadcrumbs>

      <Section
        title="المدني"
        action={
          <Button
            variant="contained"
            size="small"
            startIcon={<Iconify icon="solar:diskette-bold" width={16} />}
            onClick={() => {
              const judgment =
                typeof merged.judgment === 'object' ? merged.judgment?.name : merged.judgment;
              const form = new FormData();
              form.append('party_type', mainPartyType.id);
              form.append('company_name', merged.company_name || '');
              form.append('client_id', String(merged.client_id || ''));
              form.append(
                'filing_date',
                merged.filing_date ? String(merged.filing_date).slice(0, 10) : ''
              );
              form.append('court_name', merged.court_name || '');
              form.append('case_number', merged.case_number || '');
              form.append('case_year', String(merged.case_year || ''));
              form.append('circuit', merged.circuit || '');
              form.append('judgment', judgment || '');
              form.append('notes', merged.notes || '');
              if (documentFile instanceof File) {
                form.append('document', documentFile);
              }
              saveCase({
                id,
                axiosdata: form,
              });
              setDocumentFile(null);
            }}
            sx={{ fontWeight: 800 }}
          >
            حفظ
          </Button>
        }
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <AutocompleteComponent
              name="اختار من"
              value={mainPartyType}
              refState={(e: any) =>
                setMainDraft((p: any) => ({
                  ...p,
                  party_type: e?.id || 'company',
                  company_name: '',
                  client_id: '',
                }))
              }
              data={PARTY_TYPES}
            />
          </Grid>
          {mainPartyType.id === 'company' ? (
            <Grid item xs={12} md={8}>
              <AutocompleteComponent
                name="الشركة"
                value={mainPartyValue}
                refState={(e: any) =>
                  setMainDraft((p: any) => ({
                    ...p,
                    company_name: e?.name || '',
                    client_id: '',
                  }))
                }
                data={companies}
              />
            </Grid>
          ) : (
            <ClientSelectOrCreate
              value={mainPartyValue}
              onChange={(e) =>
                setMainDraft((p: any) => ({
                  ...p,
                  company_name: '',
                  client_id: e?.id || '',
                  client: e ? { full_name: e.name } : null,
                  party_label: e?.name || '',
                }))
              }
            />
          )}
          <Grid item xs={12} md={4}>
            <TextInputComponent
              name="تاريخ إقامة الدعوى"
              type="date"
              isDatePicker
              value={String(merged.filing_date || '').slice(0, 10)}
              refState={(e: any) => setMainDraft((p: any) => ({ ...p, filing_date: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <AutocompleteComponent
              name="المحكمة"
              value={courts.find((c: any) => c.name === merged.court_name) || null}
              refState={(e: any) => setMainDraft((p: any) => ({ ...p, court_name: e?.name || '' }))}
              data={courts}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextInputComponent
              name="رقم الدعوى"
              type="text"
              value={merged.case_number || ''}
              refState={(e: any) => setMainDraft((p: any) => ({ ...p, case_number: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextInputComponent
              name="السنة"
              type="number"
              value={merged.case_year || ''}
              refState={(e: any) => setMainDraft((p: any) => ({ ...p, case_year: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <AutocompleteComponent
              name="الدائرة"
              value={circuits.find((c: any) => c.name === merged.circuit) || null}
              refState={(e: any) => setMainDraft((p: any) => ({ ...p, circuit: e?.name || '' }))}
              data={circuits}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <AutocompleteComponent
              name="الحكم"
              value={
                SENTENCE_OPTIONS.find((s) => s.name === merged.judgment) ||
                (merged.judgment ? { id: merged.judgment, name: merged.judgment } : null)
              }
              refState={(e: any) => setMainDraft((p: any) => ({ ...p, judgment: e?.name || e || '' }))}
              data={SENTENCE_OPTIONS}
            />
          </Grid>
          <Grid item xs={12}>
            <TextInputComponent
              name="ملاحظات"
              type="text"
              value={merged.notes || ''}
              refState={(e: any) => setMainDraft((p: any) => ({ ...p, notes: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography sx={{ fontWeight: 800, fontSize: 14, mb: 1 }}>المستند / ملف الدعوى</Typography>
            {civilCase.file_path ? (
              <Box sx={{ mb: 1.5 }}>
                <PdfFileCell path={civilCase.file_path} name={civilCase.file_name || civilCase.file_path} />
              </Box>
            ) : (
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', mb: 1.5 }}>
                لا يوجد مستند مرفوع
              </Typography>
            )}
            <PDFUpload
              selectedFileName={documentFile?.name || null}
              onFileSelect={(file) => setDocumentFile(file)}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 14 }}>الجلسات</Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Iconify icon="mingcute:add-line" width={16} />}
              onClick={() => {
                setHearingPhase('main');
                setHearingPayload({ hearing_date: '', decision: '', notes: '' });
                setHearingOpen(true);
              }}
              sx={{ fontWeight: 800 }}
            >
              إضافة جلسة
            </Button>
          </Box>
          <HearingList items={civilCase.main_hearings || []} />
        </Box>
      </Section>

      <Section
        title="التقرير بالاستئناف"
        action={
          <Button
            variant="contained"
            size="small"
            startIcon={<Iconify icon="solar:diskette-bold" width={16} />}
            onClick={() => {
              const judgment =
                typeof appealMerged.judgment === 'object'
                  ? appealMerged.judgment?.name
                  : appealMerged.judgment;
              saveAppeal({
                id,
                axiosdata: {
                  party_type: mainPartyType.id,
                  company_name: mainPartyType.id === 'company' ? merged.company_name || '' : '',
                  client_id: mainPartyType.id === 'client' ? merged.client_id || '' : '',
                  appeal_date: appealMerged.appeal_date
                    ? String(appealMerged.appeal_date).slice(0, 10)
                    : '',
                  court_name: appealMerged.court_name || '',
                  appeal_number: appealMerged.appeal_number || '',
                  appeal_year: appealMerged.appeal_year || '',
                  circuit: appealMerged.circuit || '',
                  judgment: judgment || '',
                  notes: appealMerged.notes || '',
                },
              });
            }}
            sx={{ fontWeight: 800 }}
          >
            حفظ الاستئناف
          </Button>
        }
      >
        <Typography sx={{ mb: 2, fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
          الطرف: {mainPartyType.id === 'company' ? 'شركة' : 'عميل'} —{' '}
          {merged.party_label || merged.company_name || merged.client?.full_name || '—'}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextInputComponent
              name="تاريخ الاستئناف"
              type="date"
              isDatePicker
              value={String(appealMerged.appeal_date || '').slice(0, 10)}
              refState={(e: any) => setAppealDraft((p: any) => ({ ...p, appeal_date: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <AutocompleteComponent
              name="المحكمة"
              value={courts.find((c: any) => c.name === appealMerged.court_name) || null}
              refState={(e: any) => setAppealDraft((p: any) => ({ ...p, court_name: e?.name || '' }))}
              data={courts}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextInputComponent
              name="رقم الاستئناف"
              type="text"
              value={appealMerged.appeal_number || ''}
              refState={(e: any) => setAppealDraft((p: any) => ({ ...p, appeal_number: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextInputComponent
              name="السنة"
              type="number"
              value={appealMerged.appeal_year || ''}
              refState={(e: any) => setAppealDraft((p: any) => ({ ...p, appeal_year: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <AutocompleteComponent
              name="الدائرة"
              value={circuits.find((c: any) => c.name === appealMerged.circuit) || null}
              refState={(e: any) => setAppealDraft((p: any) => ({ ...p, circuit: e?.name || '' }))}
              data={circuits}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <AutocompleteComponent
              name="الحكم"
              value={
                SENTENCE_OPTIONS.find((s) => s.name === appealMerged.judgment) ||
                (appealMerged.judgment
                  ? { id: appealMerged.judgment, name: appealMerged.judgment }
                  : null)
              }
              refState={(e: any) =>
                setAppealDraft((p: any) => ({ ...p, judgment: e?.name || e || '' }))
              }
              data={SENTENCE_OPTIONS}
            />
          </Grid>
          <Grid item xs={12}>
            <TextInputComponent
              name="ملاحظات"
              type="text"
              value={appealMerged.notes || ''}
              refState={(e: any) => setAppealDraft((p: any) => ({ ...p, notes: e.target.value }))}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 14 }}>جلسات الاستئناف</Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Iconify icon="mingcute:add-line" width={16} />}
              onClick={() => {
                setHearingPhase('appeal');
                setHearingPayload({ hearing_date: '', decision: '', notes: '' });
                setHearingOpen(true);
              }}
              sx={{ fontWeight: 800 }}
            >
              إضافة جلسة
            </Button>
          </Box>
          <HearingList items={civilCase.appeal_hearings || []} />
        </Box>
      </Section>

      <ModalContainer
        modalState={hearingOpen}
        modalChangeState={() => setHearingOpen(false)}
        modalTitle={hearingPhase === 'appeal' ? 'إضافة جلسة استئناف' : 'إضافة جلسة'}
        modalSubtitle="تسجيل تاريخ الجلسة والقرار والملاحظات"
        btnTitle="تسجيل"
        endIcon={<CheckOutlined />}
        modalAction={() => {
          addHearing({
            id,
            axiosdata: { ...hearingPayload, phase: hearingPhase },
          });
          setHearingOpen(false);
        }}
      >
        <TextInputComponent
          name="الجلسة"
          type="date"
          isDatePicker
          value={hearingPayload.hearing_date}
          refState={(e: any) => setHearingPayload((p) => ({ ...p, hearing_date: e.target.value }))}
        />
        <TextInputComponent
          name="القرار"
          type="text"
          value={hearingPayload.decision}
          refState={(e: any) => setHearingPayload((p) => ({ ...p, decision: e.target.value }))}
        />
        <TextInputComponent
          name="ملاحظات"
          type="text"
          value={hearingPayload.notes}
          refState={(e: any) => setHearingPayload((p) => ({ ...p, notes: e.target.value }))}
        />
      </ModalContainer>
    </DashboardContent>
  );
}
