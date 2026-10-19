import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { Chart, useChart } from 'src/components/chart';

type NamedCount = { name: string; count: number };

type SystemStats = {
  totals?: {
    legal_cases?: number;
    legal_open?: number;
    legal_closed?: number;
    civil_cases?: number;
    clients?: number;
    warnings?: number;
  };
  monthly?: {
    labels?: string[];
    legal_cases?: number[];
    civil_cases?: number[];
    warnings?: number[];
  };
  cases_by_type?: NamedCount[];
  cases_by_court?: NamedCount[];
  warnings_by_status?: NamedCount[];
  cases_status?: NamedCount[];
  overview?: NamedCount[];
};

const COLORS = ['#1A2942', '#0F766E', '#B45309', '#15803D', '#1D4ED8', '#BE123C'];

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card
      sx={{
        p: 2.5,
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'grey.200',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
      }}
    >
      <Typography sx={{ fontWeight: 800, fontSize: 15, color: 'primary.main', mb: 2 }}>
        {title}
      </Typography>
      {children}
    </Card>
  );
}

export function SystemStatsCharts({ stats }: { stats?: SystemStats | null }) {
  const totals = stats?.totals || {};
  const monthly = stats?.monthly || {};
  const overview = stats?.overview || [];
  const casesStatus = stats?.cases_status || [];
  const casesByType = stats?.cases_by_type || [];
  const casesByCourt = stats?.cases_by_court || [];
  const warningsByStatus = stats?.warnings_by_status || [];

  const summaryCards = [
    { label: 'الجنح', value: totals.legal_cases || 0, color: '#1A2942' },
    { label: 'مفتوحة', value: totals.legal_open || 0, color: '#B45309' },
    { label: 'مغلقة', value: totals.legal_closed || 0, color: '#15803D' },
    { label: 'المدني', value: totals.civil_cases || 0, color: '#0F766E' },
    { label: 'العملاء', value: totals.clients || 0, color: '#1D4ED8' },
    { label: 'الإنذارات', value: totals.warnings || 0, color: '#BE123C' },
  ];

  const trendOptions = useChart({
    chart: { stacked: false },
    xaxis: { categories: monthly.labels || [] },
    stroke: { width: 3, curve: 'smooth' },
    legend: { position: 'top', horizontalAlign: 'right' },
    tooltip: { y: { formatter: (value: number) => `${value}` } },
    colors: ['#1A2942', '#0F766E', '#BE123C'],
  });

  const overviewOptions = useChart({
    labels: overview.map((item) => item.name),
    legend: { position: 'bottom' },
    colors: COLORS,
    tooltip: { y: { formatter: (value: number) => `${value}` } },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: 'الإجمالي',
              formatter: () => String(overview.reduce((sum, item) => sum + (item.count || 0), 0)),
            },
          },
        },
      },
    },
  });

  const statusOptions = useChart({
    labels: casesStatus.map((item) => item.name),
    legend: { position: 'bottom' },
    colors: ['#B45309', '#15803D'],
    tooltip: { y: { formatter: (value: number) => `${value}` } },
  });

  const typeOptions = useChart({
    labels: casesByType.map((item) => item.name),
    legend: { position: 'bottom' },
    colors: ['#1A2942', '#0F766E', '#94A3B8'],
    tooltip: { y: { formatter: (value: number) => `${value}` } },
  });

  const courtOptions = useChart({
    plotOptions: { bar: { borderRadius: 6, columnWidth: '48%', distributed: true } },
    xaxis: { categories: casesByCourt.map((item) => item.name) },
    legend: { show: false },
    colors: COLORS,
    tooltip: { y: { formatter: (value: number) => `${value}` } },
  });

  const warningLabels = warningsByStatus.length
    ? warningsByStatus.map((item) => item.name)
    : ['لا توجد بيانات'];
  const warningSeries = warningsByStatus.length
    ? warningsByStatus.map((item) => item.count || 0)
    : [0];
  const warningOptions = useChart({
    labels: warningLabels,
    legend: { position: 'bottom' },
    colors: warningsByStatus.length ? ['#1D4ED8', '#0F766E', '#94A3B8'] : ['#CBD5E1'],
    tooltip: { y: { formatter: (value: number) => `${value}` } },
  });

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {summaryCards.map((card) => (
          <Grid item xs={6} sm={4} md={2} key={card.label}>
            <Card
              sx={{
                p: 2,
                borderRadius: 2.5,
                borderTop: `4px solid ${card.color}`,
                border: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.secondary' }}>
                {card.label}
              </Typography>
              <Typography sx={{ mt: 0.75, fontWeight: 800, fontSize: 26, color: card.color }}>
                {card.value}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <ChartCard title="حركة النظام خلال 6 أشهر">
            <Chart
              type="line"
              height={320}
              series={[
                { name: 'الجنح', data: monthly.legal_cases || [] },
                { name: 'المدني', data: monthly.civil_cases || [] },
                { name: 'الإنذارات', data: monthly.warnings || [] },
              ]}
              options={trendOptions}
            />
          </ChartCard>
        </Grid>
        <Grid item xs={12} lg={4}>
          <ChartCard title="توزيع بيانات النظام">
            <Chart
              type="donut"
              height={320}
              series={overview.map((item) => item.count || 0)}
              options={overviewOptions}
            />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <ChartCard title="حالة الجنح">
            <Chart
              type="donut"
              height={280}
              series={casesStatus.map((item) => item.count || 0)}
              options={statusOptions}
            />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <ChartCard title="الجنح حسب النوع">
            <Chart
              type="pie"
              height={280}
              series={casesByType.map((item) => item.count || 0)}
              options={typeOptions}
            />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <ChartCard title="الإنذارات (معلن / إجابة)">
            <Chart type="donut" height={280} series={warningSeries} options={warningOptions} />
          </ChartCard>
        </Grid>
        <Grid item xs={12}>
          <ChartCard title="أعلى المحاكم في الجنح">
            <Chart
              type="bar"
              height={300}
              series={[{ name: 'عدد القضايا', data: casesByCourt.map((item) => item.count || 0) }]}
              options={courtOptions}
            />
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
}
