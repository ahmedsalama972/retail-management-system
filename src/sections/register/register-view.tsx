import { useState } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import TextInputComponent from 'src/components/utils/TextInputComponent';
import { useRegisterMutation } from 'src/hooks/customHooks';
import { CircularLoader } from 'src/utils/CircularLoader';
import AutocompleteComponent from 'src/components/utils/AutoCompleteComponent';

// ----------------------------------------------------------------------


interface RegisterPayload {
  name: string;
  email: string;
  type: {
    name: string;
    id: any;
  } | null;
  work_type: string;
  password: string;
  password_confirmation: string;
}


export function RegisterView() {
  const accTypes = [
    {
      id: 1,
      name: "موظف قانوني"
    },
    {
      id: 2,
      name: "مدير"
    },
    {
      id: 3,
      name: "مشرف"
    },
    {
      id: 4,
      name: "شركة"
    },
  ]
  const [isLoading, setIsLoading] = useState(false);
  const [registerPayload, setRegisterPayload] = useState<RegisterPayload>({
    name: "",
    email: "",
    type: null,
    work_type: "",
    password: "",
    password_confirmation: ""
  })

  const { mutate: RegisterMutation } = useRegisterMutation({
    key: 'Register_API',
    setOpen: () => { },
    setIsLoading,
  });

  const renderForm = (
    <Box display="flex" flexDirection="column" alignItems="flex-end">
      {isLoading && <CircularLoader />}
      <Box sx={{ width: '100%' }}>
        <TextInputComponent
          name="الاسم"
          type="text"
          value={registerPayload?.name}
          refState={(e: any) => {
            const temppayload = { ...registerPayload };
            temppayload.name = e.target.value;
            setRegisterPayload({ ...temppayload });
          }}
          helperText="إدخال غير صحيح"
          required
        />
      </Box>
      <Box sx={{ width: '100%' }}>
        <TextInputComponent
          name="البريد الالكتروني"
          type="text"
          value={registerPayload?.email}
          refState={(e: any) => {
            const temppayload = { ...registerPayload };
            temppayload.email = e.target.value;
            setRegisterPayload({ ...temppayload });
          }}
          helperText="إدخال غير صحيح"
          required
        />
      </Box>
      <Box sx={{ width: '100%' }}>
        <TextInputComponent
          name="كلمة المرور"
          type="password"
          value={registerPayload?.password}
          refState={(e: any) => {
            const temppayload = { ...registerPayload };
            temppayload.password = e.target.value;
            setRegisterPayload({ ...temppayload });
          }}
          helperText="إدخال غير صحيح"
          required
        />
      </Box>
      <Box sx={{ width: '100%' }}>
        <TextInputComponent
          name="تأكيد كلمة المرور"
          type="password"
          value={registerPayload?.password_confirmation}
          refState={(e: any) => {
            const temppayload = { ...registerPayload };
            temppayload.password_confirmation = e.target.value;
            setRegisterPayload({ ...temppayload });
          }}
          helperText="إدخال غير صحيح"
          required
        />
      </Box>
      <Box sx={{ width: '100%' }}>
        <AutocompleteComponent
          name="النوع"
          type="text"
          value={registerPayload.type?.name || ''}
          refState={(e: any) => {
            setRegisterPayload(prev => ({ ...prev, type: e?.name }));
          }}
          list={accTypes || []}
          data={accTypes || []}
        />
      </Box>
      <Box sx={{ width: '100%' }}>
        <TextInputComponent
          name="طبيعة العمل"
          type="text"
          value={registerPayload?.work_type}
          refState={(e: any) => {
            const temppayload = { ...registerPayload };
            temppayload.work_type = e.target.value;
            setRegisterPayload({ ...temppayload });
          }}
          helperText="إدخال غير صحيح"
          required
        />
      </Box>
      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        color="inherit"
        variant="contained"
        onClick={() => RegisterMutation(registerPayload)}
      >
        تسجيل
      </LoadingButton>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
      }}
    >
      <Box
        sx={{
          width: 1,
          maxWidth: 480,
          bgcolor: '#fff',
          borderRadius: 3,
          p: { xs: 2.5, sm: 4 },
          boxShadow: '0 18px 48px rgba(15, 23, 42, 0.12)',
          border: '1px solid',
          borderColor: 'grey.200',
        }}
      >
        <Box gap={1.5} display="flex" flexDirection="column" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
            انشاء حساب
          </Typography>
        </Box>
        {renderForm}
      </Box>
    </Box>
  );
}
