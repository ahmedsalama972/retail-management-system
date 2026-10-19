import { useEffect, useMemo, useRef, useState } from 'react';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { toast, Toaster } from 'sonner';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { FEATURE_LABELS, featureLabel, getStoredUser, type FeatureKey } from 'src/utils/user-role';
import {
  useGetSigningAssets,
  useSaveSigningSealMutation,
  useSaveSigningSignatureMutation,
} from 'src/hooks/customHooks';
import { SimpleSignatureCanvas } from 'src/sections/pdf-sign/components/simple-signature-canvas';
import type { SignatureCanvasHandle } from 'src/sections/pdf-sign/components/simple-signature-canvas';
import {
  readFileAsDataUrl,
  resolveSigningAssetUrl,
  setStoredSeal,
  setStoredSignature,
  syncStoredSigningAssets,
} from 'src/sections/pdf-sign/utils/signing-assets';

function rolePermissionLabel(type?: string | null) {
  const value = String(type || '').trim();
  if (value.includes('مدير')) return 'صلاحية مطلقة';
  if (value.includes('مشرف')) return 'صلاحية إشراف';
  if (value === 'شركة' || value.toLowerCase() === 'company') return 'حساب شركة — التوقيع الإلكتروني';
  if (value) return value;
  return 'صلاحية تشغيل';
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, py: 1.25 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.5,
          bgcolor: '#F1F5F9',
          color: '#475569',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <Iconify icon={icon} width={18} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', mb: 0.35 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A', wordBreak: 'break-word' }}>
          {value || '—'}
        </Typography>
      </Box>
    </Box>
  );
}

export function ProfileView() {
  const user = getStoredUser();
  const canvasRef = useRef<SignatureCanvasHandle | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [sealPreview, setSealPreview] = useState<string | null>(null);
  const [signatureLocked, setSignatureLocked] = useState(false);
  const [sealLocked, setSealLocked] = useState(false);

  const { data, refetch } = useGetSigningAssets({ key: 'GetSigningAssets_API' });
  const assets = data?.data?.assets;
  const { mutate: saveSignature, isLoading: savingSig } = useSaveSigningSignatureMutation({ refetch });
  const { mutate: saveSeal, isLoading: savingSeal } = useSaveSigningSealMutation({ refetch });

  const displayName = user?.name || 'مستخدم النظام';
  const email = user?.email || '—';
  const role = user?.type || '—';
  const workType = user?.work_type || '—';
  const companyName = user?.company_name || user?.companyname || '—';
  const permission = rolePermissionLabel(role);
  const initial = String(displayName).trim().charAt(0) || 'م';

  const featureChips = useMemo(() => {
    const features = user?.features || {};
    return (Object.keys(FEATURE_LABELS) as FeatureKey[]).filter((key) => Boolean(features[key]));
  }, [user?.features]);

  useEffect(() => {
    setSignaturePreview(null);
    setSealPreview(null);
    setSignatureLocked(false);
    setSealLocked(false);
  }, [user?.id]);

  useEffect(() => {
    if (!assets) return;
    syncStoredSigningAssets(assets);
    setSignaturePreview(resolveSigningAssetUrl(assets.signature_url) || null);
    setSealPreview(resolveSigningAssetUrl(assets.seal_url) || null);
    setSignatureLocked(Boolean(assets.signature_locked || assets.has_signature));
    setSealLocked(Boolean(assets.seal_locked || assets.has_seal));
  }, [assets, user?.id]);

  const saveDrawn = () => {
    if (signatureLocked) {
      toast.error('لا يمكن تغيير التوقيع بعد حفظه.');
      return;
    }
    if (!canvasRef.current || canvasRef.current.isEmpty()) {
      toast.error('ارسم التوقيع أولاً');
      return;
    }
    const dataUrl = canvasRef.current.getTransparentDataUrl();
    setStoredSignature(dataUrl);
    setSignaturePreview(dataUrl);
    saveSignature({ image: dataUrl, kind: 'drawn' });
  };

  const uploadSignatureFile = async (file?: File | null) => {
    if (signatureLocked) {
      toast.error('لا يمكن تغيير التوقيع بعد حفظه.');
      return;
    }
    if (!file) return;
    try {
      const form = new FormData();
      form.append('file', file);
      const dataUrl = await readFileAsDataUrl(file);
      setStoredSignature(dataUrl);
      setSignaturePreview(dataUrl);
      saveSignature(form);
    } catch (error) {
      console.error(error);
      toast.error('تعذر قراءة ملف التوقيع');
    }
  };

  const clearDrawing = () => {
    canvasRef.current?.clear();
  };

  const uploadSeal = async (file?: File | null) => {
    if (sealLocked) {
      toast.error('لا يمكن تغيير الختم بعد حفظه.');
      return;
    }
    if (!file) return;
    try {
      const form = new FormData();
      form.append('file', file);
      const dataUrl = await readFileAsDataUrl(file);
      setStoredSeal(dataUrl);
      setSealPreview(dataUrl);
      saveSeal(form);
    } catch (error) {
      console.error(error);
      toast.error('تعذر قراءة ملف الختم');
    }
  };

  return (
    <DashboardContent>
      <Toaster richColors expand={false} duration={5000} />

      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', mb: 0.75 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
            الملف الشخصي والبيانات
          </Typography>
          <Chip
            size="small"
            label="حساب نشط"
            sx={{ height: 26, fontWeight: 800, fontSize: 12, bgcolor: '#DBEAFE', color: '#1D4ED8' }}
          />
        </Box>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 600, maxWidth: 720, lineHeight: 1.7 }}>
          عرض بيانات الحساب وصلاحيات المستخدم، مع إعداد التوقيع الإلكتروني المستخدم في توقيع المستندات.
        </Typography>
      </Box>

      {/* Restored admin-style account banner */}
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
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.75, minWidth: 0 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            badgeContent={
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  bgcolor: '#C9A227',
                  color: '#1A2942',
                  display: 'grid',
                  placeItems: 'center',
                  border: '2px solid #1A2942',
                }}
              >
                <Iconify icon="solar:shield-check-bold" width={11} />
              </Box>
            }
          >
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'rgba(255,255,255,0.12)', fontWeight: 800, fontSize: 24 }}>
              {initial}
            </Avatar>
          </Badge>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.6 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 18 }}>{displayName}</Typography>
              <Chip
                size="small"
                label={
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#22C55E' }} />
                    نشط
                  </Box>
                }
                sx={{
                  height: 24,
                  fontWeight: 800,
                  fontSize: 11,
                  bgcolor: 'rgba(34,197,94,0.16)',
                  color: '#BBF7D0',
                  border: '1px solid rgba(167,243,208,0.35)',
                }}
              />
            </Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, opacity: 0.85, mb: 1 }} noWrap>
              {email}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                label={role}
                sx={{
                  height: 24,
                  fontWeight: 800,
                  fontSize: 11,
                  bgcolor: 'rgba(234,179,8,0.18)',
                  color: '#FDE68A',
                  border: '1px solid rgba(253,230,138,0.35)',
                }}
              />
              <Chip
                size="small"
                label={permission}
                sx={{
                  height: 24,
                  fontWeight: 700,
                  fontSize: 11,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: '#E2E8F0',
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={5}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'grey.200',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
              height: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Iconify icon="solar:user-id-bold-duotone" width={22} sx={{ color: 'primary.main' }} />
              <Typography sx={{ fontWeight: 800, fontSize: 15.5, color: 'primary.main' }}>
                بيانات الحساب
              </Typography>
            </Box>
            <Divider sx={{ mb: 0.5 }} />
            <InfoRow icon="solar:user-bold" label="الاسم" value={displayName} />
            <InfoRow icon="solar:letter-bold" label="البريد الإلكتروني" value={email} />
            <InfoRow icon="solar:shield-user-bold" label="نوع الحساب" value={role} />
            <InfoRow icon="solar:case-round-bold" label="طبيعة العمل" value={workType} />
            <InfoRow icon="solar:buildings-2-bold" label="اسم الشركة" value={companyName} />
            <InfoRow icon="solar:key-bold" label="الصلاحية" value={permission} />

            <Box sx={{ mt: 1.5 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', mb: 1 }}>
                صلاحيات الوصول
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {featureChips.length > 0 ? (
                  featureChips.map((key) => (
                    <Chip
                      key={key}
                      size="small"
                      label={featureLabel(key)}
                      sx={{ height: 24, fontWeight: 700, fontSize: 11, bgcolor: '#F1F5F9' }}
                    />
                  ))
                ) : (
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.disabled' }}>—</Typography>
                )}
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card
            id="signature-assets"
            sx={{
              p: 2.5,
              mb: 2.5,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'grey.200',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Iconify icon="solar:pen-new-square-bold-duotone" width={22} sx={{ color: 'primary.main' }} />
              <Typography sx={{ fontWeight: 800, fontSize: 15.5, color: 'primary.main' }}>
                التوقيع الإلكتروني
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" mb={2} sx={{ fontWeight: 600 }}>
              بعد الحفظ لا يمكن تعديل التوقيع أو حذفه. يُستخدم هذا التوقيع عند توقيع المستندات.
            </Typography>

            {signaturePreview && (
              <Box
                component="img"
                src={signaturePreview}
                alt="signature"
                sx={{
                  maxHeight: 90,
                  mb: 2,
                  display: 'block',
                  bgcolor: '#f8fafc',
                  p: 1.5,
                  borderRadius: 1.5,
                  border: '1px solid #e2e8f0',
                }}
              />
            )}

            {signatureLocked ? (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                تم حفظ التوقيع نهائياً — لا يمكن تغييره أو إزالته.
              </Alert>
            ) : (
              <>
                <SimpleSignatureCanvas ref={canvasRef} height={180} />
                <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                  <Button variant="contained" disabled={savingSig} onClick={saveDrawn} sx={{ fontWeight: 800 }}>
                    حفظ التوقيع نهائياً
                  </Button>
                  <Button variant="outlined" color="inherit" disabled={savingSig} onClick={clearDrawing} sx={{ fontWeight: 700 }}>
                    مسح الرسم
                  </Button>
                  <Button component="label" variant="outlined" disabled={savingSig} sx={{ fontWeight: 700 }}>
                    رفع صورة التوقيع
                    <input
                      hidden
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg,image/webp"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        await uploadSignatureFile(file);
                        event.target.value = '';
                      }}
                    />
                  </Button>
                </Box>
              </>
            )}
          </Card>

          <Card
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'grey.200',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Iconify icon="solar:medal-ribbons-star-bold-duotone" width={22} sx={{ color: 'primary.main' }} />
              <Typography sx={{ fontWeight: 800, fontSize: 15.5, color: 'primary.main' }}>
                الختم (اختياري)
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" mb={2} sx={{ fontWeight: 600 }}>
              ارفع صورة الختم فقط. بعد الحفظ لا يمكن تعديل الختم أو حذفه.
            </Typography>

            {sealPreview && (
              <Box
                component="img"
                src={sealPreview}
                alt="seal"
                sx={{
                  maxHeight: 90,
                  mb: 2,
                  display: 'block',
                  bgcolor: '#f8fafc',
                  p: 1.5,
                  borderRadius: 1.5,
                  border: '1px solid #e2e8f0',
                }}
              />
            )}

            {sealLocked ? (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                تم حفظ الختم نهائياً — لا يمكن تغييره أو إزالته.
              </Alert>
            ) : (
              <Button
                component="label"
                variant="contained"
                disabled={savingSeal}
                sx={{ fontWeight: 800 }}
                startIcon={<Iconify icon="solar:gallery-add-bold-duotone" width={18} />}
              >
                رفع صورة الختم
                <input
                  hidden
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  onChange={async (event) => {
                    await uploadSeal(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />
              </Button>
            )}
          </Card>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
