import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { textGradient } from 'src/theme/styles';
import { useRouter } from 'src/routes/hooks';
import { useGetSystemDashboard } from 'src/hooks/customHooks';
import { SystemStatsCharts } from './system-stats-charts';

export function DashboardView() {
  const router = useRouter();
  const { data } = useGetSystemDashboard({ key: 'GetSystemDashboard_API_Legal' });
  const systemStats = data?.data?.data || null;

  return (
    <DashboardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" sx={() => ({ ...textGradient(`to right, #000, rgb(12, 68, 174)`) })}>
            لوحة التحكم
          </Typography>
          <Typography color="text.secondary" mt={0.5} sx={{ fontWeight: 600 }}>
            نظرة إحصائية على بيانات النظام القانوني
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={() => router.push('/legal-cases')}>
            الجنح
          </Button>
          <Button variant="outlined" onClick={() => router.push('/civil-cases')}>
            المدني
          </Button>
          <Button variant="outlined" onClick={() => router.push('/warnings')}>
            إنذارات
          </Button>
        </Box>
      </Box>

      <SystemStatsCharts stats={systemStats} />
    </DashboardContent>
  );
}
