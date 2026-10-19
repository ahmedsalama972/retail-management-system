import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { textGradient } from 'src/theme/styles';
import { useRouter } from 'src/routes/hooks';
import { Chart, useChart } from 'src/components/chart';
import { useGetEsignDashboard, useGetSystemDashboard } from 'src/hooks/customHooks';
import { getStoredUser, hasFeature, isAdminUser, isCompanyUser } from 'src/utils/user-role';
import { SystemStatsCharts } from 'src/sections/dashboard/system-stats-charts';

export function EsignDashboardView() {
  const router = useRouter();
  const user = getStoredUser();
  const showSystemStats =
    isAdminUser(user) ||
    hasFeature(user, 'legal_module') ||
    (!isCompanyUser(user) && !hasFeature(user, 'view_inbox'));

  const { data } = useGetEsignDashboard({ key: 'GetEsignDashboard_API' });
  const { data: systemResponse } = useGetSystemDashboard({
    key: 'GetSystemDashboard_API',
    enabled: showSystemStats,
  });
  const stats = data?.data?.data || {};
  const systemStats = systemResponse?.data?.data || null;
  const monthly = stats.monthly || {};

  const cards = [
    { label: 'مستندات المكتبة', value: stats.library_total || 0, path: '/esign/library', color: '#1A2942' },
    { label: 'تم الإرسال للتوقيع', value: stats.shared_total || 0, path: '/esign/library', color: '#0F766E' },
    { label: 'بانتظار التوقيع', value: stats.unsigned_total || 0, path: '/esign/library', color: '#B45309' },
    { label: 'تم التوقيع', value: stats.signed_total || 0, path: '/esign/library', color: '#15803D' },
  ];

  const statusOptions = useChart({
    labels: ['تم التوقيع', 'بانتظار التوقيع'],
    legend: { position: 'bottom' },
    colors: ['#15803D', '#B45309'],
    tooltip: { y: { formatter: (value: number) => `${value}` } },
  });

  const trendOptions = useChart({
    xaxis: { categories: monthly.labels || [] },
    stroke: { width: 3, curve: 'smooth' },
    legend: { position: 'top', horizontalAlign: 'right' },
    colors: ['#0F766E', '#15803D'],
    tooltip: { y: { formatter: (value: number) => `${value}` } },
  });

  return (
    <DashboardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" sx={() => ({ ...textGradient(`to right, #000, rgb(12, 68, 174)`) })}>
            لوحة التحكم
          </Typography>
          <Typography color="text.secondary" mt={0.5} sx={{ fontWeight: 600 }}>
            {user?.company_name || user?.companyname || user?.name} — إحصائيات التوقيع وبيانات النظام
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="contained" color="inherit" onClick={() => router.push('/esign/generate')}>
            إنشاء ملف
          </Button>
          <Button variant="outlined" onClick={() => router.push('/esign/contracts')}>
            الملفات الواردة
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card
              onClick={() => router.push(card.path)}
              sx={{
                p: 3,
                cursor: 'pointer',
                borderTop: `4px solid ${card.color}`,
                border: '1px solid',
                borderColor: 'grey.200',
                borderRadius: 3,
                transition: '0.2s',
                '&:hover': { boxShadow: 6 },
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                {card.label}
              </Typography>
              <Typography variant="h3" sx={{ mt: 1, fontWeight: 800, color: card.color }}>
                {card.value}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography sx={{ fontWeight: 800, fontSize: 16, color: 'primary.main', mb: 1.5 }}>
        إحصائيات التوقيع الإلكتروني
      </Typography>
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'grey.200' }}>
            <Typography sx={{ fontWeight: 800, fontSize: 15, mb: 2 }}>حالة الملفات المرسلة</Typography>
            <Chart
              type="donut"
              height={280}
              series={[stats.signed_total || 0, stats.unsigned_total || 0]}
              options={statusOptions}
            />
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'grey.200' }}>
            <Typography sx={{ fontWeight: 800, fontSize: 15, mb: 2 }}>الإرسال والتوقيع خلال 6 أشهر</Typography>
            <Chart
              type="area"
              height={280}
              series={[
                { name: 'المرسلة', data: monthly.shared || [] },
                { name: 'الموقّعة', data: monthly.signed || [] },
              ]}
              options={trendOptions}
            />
          </Card>
        </Grid>
      </Grid>

      {showSystemStats && systemStats && (
        <>
          <Typography sx={{ fontWeight: 800, fontSize: 16, color: 'primary.main', mb: 1.5 }}>
            إحصائيات بيانات النظام
          </Typography>
          <SystemStatsCharts stats={systemStats} />
        </>
      )}
    </DashboardContent>
  );
}
