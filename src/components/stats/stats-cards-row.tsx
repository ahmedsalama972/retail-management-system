import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

export type StatCardItem = {
  title: string;
  value: string | number;
  hint?: string;
  hintColor?: 'success' | 'warning' | 'info' | 'primary';
};

const hintColors = {
  success: { color: '#1D8348', bgcolor: '#E8F8EF' },
  warning: { color: '#B45309', bgcolor: '#FFF7ED' },
  info: { color: '#0369A1', bgcolor: '#E0F2FE' },
  primary: { color: '#1A2942', bgcolor: '#E8EEF5' },
};

export function StatsCardsRow({ items }: { items: StatCardItem[] }) {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {items.map((item) => {
        const hintSx = hintColors[item.hintColor || 'primary'];
        return (
          <Grid item xs={12} sm={6} md={3} key={item.title}>
            <Card
              sx={{
                p: 2.25,
                height: 1,
                borderRadius: 3,
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
                border: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', mb: 1 }}>
                {item.title}
              </Typography>
              <Typography sx={{ fontSize: 34, fontWeight: 800, color: 'primary.main', lineHeight: 1.1 }}>
                {item.value}
              </Typography>
              {item.hint && (
                <Box
                  sx={{
                    mt: 1.25,
                    display: 'inline-flex',
                    px: 1,
                    py: 0.35,
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    ...hintSx,
                  }}
                >
                  {item.hint}
                </Box>
              )}
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
