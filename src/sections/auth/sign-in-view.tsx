import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import LoadingButton from '@mui/lab/LoadingButton';
import { toast } from 'sonner';

import { Iconify } from 'src/components/iconify';
import { useLoginMutation } from 'src/hooks/customHooks';
import { CircularLoader } from 'src/utils/CircularLoader';

import { formFieldSx, formInputLabelSx } from 'src/components/utils/field-styles';

const REMEMBER_KEY = 'login_remember_email';

const fieldSx = {
  ...formFieldSx,
  mb: 0,
};

export function SignInView() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginPayload, setLoginPayload] = useState({
    email: '',
    password: '',
  });

  const { mutate: LoginMutation } = useLoginMutation({
    key: 'Login_API',
    setOpen: () => {},
    setIsLoading,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setLoginPayload((prev) => ({ ...prev, email: saved }));
        setRememberMe(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLogin = () => {
    if (rememberMe) {
      try {
        localStorage.setItem(REMEMBER_KEY, loginPayload.email);
      } catch {
        // ignore
      }
    } else {
      try {
        localStorage.removeItem(REMEMBER_KEY);
      } catch {
        // ignore
      }
    }
    LoginMutation(loginPayload);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#E8EEF5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 1.5, sm: 2.5 },
        py: { xs: 2.5, sm: 4 },
      }}
    >
      {isLoading && <CircularLoader />}

      <Box
        sx={{
          width: 1,
          maxWidth: 1080,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.15fr 0.85fr' },
          borderRadius: 3.5,
          overflow: 'hidden',
          bgcolor: '#fff',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.14)',
          border: '1px solid',
          borderColor: 'rgba(26,41,66,0.06)',
        }}
      >
        {/* Form panel */}
        <Box sx={{ p: { xs: 2.5, sm: 4 }, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ mb: 3 }}>
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                px: 1.25,
                py: 0.45,
                borderRadius: 999,
                bgcolor: '#E8EEF5',
                color: 'primary.main',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              بوابة النظام القانوني
            </Box>
          </Box>

          <Typography sx={{ fontWeight: 800, fontSize: { xs: 22, sm: 26 }, color: '#0F172A', mb: 0.75 }}>
            تسجيل الدخول للنظام الموحد
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary', fontWeight: 500, mb: 3, lineHeight: 1.7, maxWidth: 460 }}>
            بوابة إدارة القضايا والمسائل القانونية والمتابعات الرسمية عبر منصة الاستشارات القانونية.
          </Typography>

          <Stack spacing={2.25}>
            <Box>
              <Typography sx={formInputLabelSx}>
                البريد الإلكتروني
              </Typography>
              <TextField
                fullWidth
                size="medium"
                type="email"
                placeholder="example@company.com"
                value={loginPayload.email}
                onChange={(e) => setLoginPayload((prev) => ({ ...prev, email: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                sx={fieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:user-id-bold" width={20} sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.85 }}>
                <Typography sx={{ ...formInputLabelSx, mb: 0 }}>كلمة المرور</Typography>
                <Link
                  component="button"
                  type="button"
                  underline="hover"
                  onClick={() => toast.message('يرجى التواصل مع مسؤول النظام لاستعادة كلمة المرور')}
                  sx={{ fontSize: 12.5, fontWeight: 700, color: 'primary.main' }}
                >
                  نسيت كلمة المرور؟
                </Link>
              </Box>
              <TextField
                fullWidth
                size="medium"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={loginPayload.password}
                onChange={(e) => setLoginPayload((prev) => ({ ...prev, password: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                sx={fieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:lock-password-bold" width={20} sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
                        <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} width={20} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    sx={{ color: 'primary.main', '&.Mui-checked': { color: 'primary.main' } }}
                  />
                }
                label={<Typography sx={{ fontSize: 13, fontWeight: 600 }}>تذكرني على هذا الجهاز</Typography>}
              />
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                <Iconify icon="solar:shield-check-bold" width={16} sx={{ color: '#1D8348' }} />
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#1D8348' }}>جلسة مؤمنة</Typography>
              </Box>
            </Box>

            <LoadingButton
              fullWidth
              size="large"
              loading={isLoading}
              variant="contained"
              onClick={handleLogin}
              endIcon={<Iconify icon="eva:arrow-ios-back-fill" width={18} />}
              sx={{
                mt: 0.5,
                py: 1.35,
                borderRadius: 2,
                fontWeight: 800,
                fontSize: 15,
                bgcolor: '#1A2942',
                boxShadow: '0 10px 24px rgba(26,41,66,0.28)',
                '&:hover': { bgcolor: '#0F1A2E' },
              }}
            >
              تسجيل الدخول
            </LoadingButton>
          </Stack>

          <Box
            sx={{
              mt: 'auto',
              pt: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              flexWrap: 'wrap',
            }}
          >
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {['الدعم الفني', 'دليل الاستخدام', 'الشروط والأحكام'].map((item) => (
                <Typography key={item} sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 600 }}>
                  {item}
                  {item !== 'الشروط والأحكام' ? ' •' : ''}
                </Typography>
              ))}
            </Stack>
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 700 }} dir="ltr">
              الخط الساخن: 16276
            </Typography>
          </Box>
        </Box>

        {/* Brand panel */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            bgcolor: '#1A2942',
            color: '#fff',
            px: 3.5,
            py: 4,
            position: 'relative',
            overflow: 'hidden',
            backgroundImage:
              'radial-gradient(circle at 20% 15%, rgba(201,162,39,0.18), transparent 45%), radial-gradient(circle at 90% 80%, rgba(29,131,72,0.18), transparent 40%)',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', mb: 3 }}>
            <Box
              component="img"
              src="/logo.png"
              alt="شعار النظام"
              sx={{
                width: 96,
                height: 96,
                objectFit: 'contain',
                mb: 2,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.95)',
                p: 1,
                boxShadow: '0 0 0 6px rgba(201,162,39,0.22)',
              }}
            />
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.25,
                py: 0.45,
                borderRadius: 999,
                bgcolor: 'rgba(29,131,72,0.2)',
                border: '1px solid rgba(29,131,72,0.45)',
                mb: 1.75,
              }}
            >
              <Iconify icon="solar:verified-check-bold" width={14} sx={{ color: '#4ADE80' }} />
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#BBF7D0' }}>
                الاستشارات القانونية
              </Typography>
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: 22, mb: 0.5 }}>الاستشارات القانونية</Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.82)' }}>
              نظام إدارة القضايا القانونية
            </Typography>
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              mb: 2.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Iconify icon="mdi:scale-balance" width={18} sx={{ color: '#4ADE80' }} />
              <Typography sx={{ fontWeight: 800, fontSize: 14 }}>سيادة القانون والعدالة الرقمية</Typography>
            </Box>
            <Typography sx={{ fontSize: 12.5, lineHeight: 1.8, color: 'rgba(255,255,255,0.72)', fontWeight: 500 }}>
              منصة موحدة لتسجيل ومتابعة القضايا والإنذارات والملفات القضائية مع توقيع إلكتروني آمن وتتبع كامل لحالة كل ملف.
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25, mb: 3 }}>
            {[
              { value: '+256', label: 'نيابة ومأمورية مميكنة' },
              { value: '100%', label: 'سجلات قضائية مشفرة' },
            ].map((item) => (
              <Box
                key={item.label}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.14)',
                  bgcolor: 'rgba(255,255,255,0.03)',
                }}
              >
                <Typography sx={{ fontWeight: 800, fontSize: 18, mb: 0.35 }}>{item.value}</Typography>
                <Typography sx={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', fontWeight: 600, lineHeight: 1.5 }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
              <Iconify icon="solar:shield-network-bold" width={16} sx={{ color: '#86EFAC' }} />
              <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
                بوابة مؤمنة بتشفير SSL 256-bit
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }} dir="ltr">
              v4.8.2
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mt: 2.5, textAlign: 'center', maxWidth: 720, px: 2 }}>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, lineHeight: 1.8 }}>
          جميع الحقوق محفوظة © {new Date().getFullYear()} — الاستشارات القانونية
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: 'text.disabled', fontWeight: 500 }}>
          نظام إدارة القضايا القانونية
        </Typography>
      </Box>
    </Box>
  );
}
