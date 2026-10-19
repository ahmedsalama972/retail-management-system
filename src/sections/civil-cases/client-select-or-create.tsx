import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import TextInputComponent from 'src/components/utils/TextInputComponent';
import AutocompleteComponent from 'src/components/utils/AutoCompleteComponent';
import { useAddClientMutation, useGetClients } from 'src/hooks/customHooks';

export type ClientOption = {
  id: number | string;
  name: string;
  full_name?: string;
  mobile?: string;
};

type Props = {
  value: ClientOption | null;
  onChange: (client: ClientOption | null) => void;
  label?: string;
};

type NewClientForm = {
  client_app_id: string;
  client_number: string;
  full_name: string;
  full_name_en: string;
  mobile: string;
  national_id: string;
  phone_1: string;
  phone_2: string;
  office_phone: string;
  dob: string;
  company_name: string;
  work_office: string;
  home_address: string;
  work_address: string;
};

const EMPTY_CLIENT: NewClientForm = {
  client_app_id: '',
  client_number: '',
  full_name: '',
  full_name_en: '',
  mobile: '',
  national_id: '',
  phone_1: '',
  phone_2: '',
  office_phone: '',
  dob: '',
  company_name: '',
  work_office: '',
  home_address: '',
  work_address: '',
};

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

/**
 * Renders as Grid items (must be a direct child of <Grid container>):
 * - md={8}: العميل select (+ button when collapsed)
 * - xs={12}: full-width عميل جديد form block when open
 */
export function ClientSelectOrCreate({ value, onChange, label = 'العميل' }: Props) {
  const [addingNew, setAddingNew] = useState(false);
  const [newClient, setNewClient] = useState<NewClientForm>(EMPTY_CLIENT);
  const [creating, setCreating] = useState(false);

  const { data, refetch } = useGetClients({
    key: 'GetClients_Picker',
    page: 1,
    search: '',
    perPage: 100,
  });

  const { mutate: addClient } = useAddClientMutation({
    setIsLoading: setCreating,
    refetch,
    onSuccess: (created: any) => {
      onChange({
        id: created.id,
        name: created.full_name || created.name,
        full_name: created.full_name,
        mobile: created.mobile,
      });
      setAddingNew(false);
      setNewClient(EMPTY_CLIENT);
    },
  });

  const options = useMemo(
    () =>
      (data?.data?.data || []).map((c: any) => ({
        id: c.id,
        name: c.full_name || c.name,
        full_name: c.full_name,
        mobile: c.mobile,
      })),
    [data]
  );

  const updateField =
    (key: keyof NewClientForm) =>
    (e: any) =>
      setNewClient((prev) => ({ ...prev, [key]: e.target.value }));

  const resetForm = () => {
    setAddingNew(false);
    setNewClient(EMPTY_CLIENT);
  };

  const handleCreate = () => {
    const fullName = newClient.full_name.trim();
    if (!fullName) return;

    const clientNumber =
      newClient.client_number.trim() ||
      newClient.client_app_id.trim() ||
      `CL-${Date.now()}`;

    addClient({
      client_app_id: newClient.client_app_id.trim() || null,
      client_number: clientNumber,
      full_name: fullName,
      full_name_en: newClient.full_name_en.trim() || null,
      mobile: newClient.mobile.trim() || null,
      national_id: newClient.national_id.trim() || null,
      phone_1: newClient.phone_1.trim() || null,
      phone_2: newClient.phone_2.trim() || null,
      office_phone: newClient.office_phone.trim() || null,
      dob: newClient.dob || null,
      company_name: newClient.company_name.trim() || null,
      work_office: newClient.work_office.trim() || null,
      home_address: newClient.home_address.trim() || null,
      work_address: newClient.work_address.trim() || null,
    });
  };

  return (
    <>
      <Grid item xs={12} md={8}>
        <AutocompleteComponent name={label} value={value} refState={(e: any) => onChange(e)} data={options} />
        <Typography sx={{ mt: -1.25, mb: 1.5, fontSize: 11.5, color: 'text.secondary', fontWeight: 500, px: 0.25 }}>
          اختر من القائمة أو أضف عميلاً جديداً
        </Typography>
        {!addingNew && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="mingcute:add-line" width={16} />}
              onClick={() => setAddingNew(true)}
              sx={{ fontWeight: 800, borderRadius: 2 }}
            >
              عميل جديد
            </Button>
          </Box>
        )}
      </Grid>

      {addingNew && (
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
            <SectionTitle icon="solar:user-bold-duotone" title="بيانات العميل والموكل الأساسية" />
            <Button
              size="small"
              variant="outlined"
              onClick={resetForm}
              sx={{ fontWeight: 800, borderRadius: 2, mb: 1 }}
            >
              اختيار من القائمة
            </Button>
          </Box>

          <Box
            sx={{
              width: '100%',
              mb: 2,
              p: 2,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'grey.200',
              bgcolor: '#F8FAFC',
              boxSizing: 'border-box',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: 'primary.main' }}>
                عميل جديد
              </Typography>
              <IconButton size="small" color="error" onClick={resetForm}>
                <Iconify icon="solar:trash-bin-trash-bold" width={18} />
              </IconButton>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextInputComponent
                  name="رقم تطبيق العميل"
                  type="text"
                  value={newClient.client_app_id}
                  refState={(e: any) =>
                    setNewClient((prev) => ({
                      ...prev,
                      client_app_id: e.target.value,
                      client_number: e.target.value || prev.client_number,
                    }))
                  }
                />
                <FieldHint>معرّف التطبيق المستخدم للربط مع أنظمة التجزئة</FieldHint>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextInputComponent
                  name="رقم العميل"
                  type="text"
                  value={newClient.client_number}
                  refState={updateField('client_number')}
                />
                <FieldHint>الرقم الموحد للعميل داخل النظام</FieldHint>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextInputComponent
                  name="اسم العميل بالعربية *"
                  type="text"
                  value={newClient.full_name}
                  refState={updateField('full_name')}
                />
                <FieldHint>الاسم الرسمي كما يظهر في المستندات القضائية</FieldHint>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextInputComponent
                  name="اسم العميل بالإنجليزية"
                  type="text"
                  value={newClient.full_name_en}
                  refState={updateField('full_name_en')}
                />
                <FieldHint>مطلوب للعقود أو المراسلات الأجنبية إن وجدت</FieldHint>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextInputComponent
                  name="رقم الموبايل *"
                  type="text"
                  value={newClient.mobile}
                  refState={updateField('mobile')}
                />
                <FieldHint>رقم التواصل المسجل للإشعارات القضائية</FieldHint>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextInputComponent
                  name="الرقم القومي"
                  type="text"
                  value={newClient.national_id}
                  refState={updateField('national_id')}
                />
                <FieldHint>يُفضّل مطابقته مع التوكيل أو بطاقة الرقم القومي</FieldHint>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextInputComponent
                  name="هاتف 1"
                  type="text"
                  value={newClient.phone_1}
                  refState={updateField('phone_1')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextInputComponent
                  name="هاتف 2"
                  type="text"
                  value={newClient.phone_2}
                  refState={updateField('phone_2')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextInputComponent
                  name="هاتف العمل"
                  type="text"
                  value={newClient.office_phone}
                  refState={updateField('office_phone')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextInputComponent
                  name="تاريخ الميلاد"
                  type="date"
                  isDatePicker
                  value={newClient.dob}
                  refState={updateField('dob')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextInputComponent
                  name="جهة العمل"
                  type="text"
                  value={newClient.company_name}
                  refState={updateField('company_name')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextInputComponent
                  name="مكتب العمل"
                  type="text"
                  value={newClient.work_office}
                  refState={updateField('work_office')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextInputComponent
                  name="عنوان المنزل"
                  type="text"
                  value={newClient.home_address}
                  refState={updateField('home_address')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextInputComponent
                  name="عنوان العمل"
                  type="text"
                  value={newClient.work_address}
                  refState={updateField('work_address')}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  size="small"
                  disabled={creating || !newClient.full_name.trim()}
                  startIcon={<Iconify icon="mingcute:add-line" width={16} />}
                  onClick={handleCreate}
                  sx={{ fontWeight: 800, borderRadius: 2 }}
                >
                  حفظ العميل واختياره
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      )}
    </>
  );
}
