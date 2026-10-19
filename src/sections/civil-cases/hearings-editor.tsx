import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import TextInputComponent from 'src/components/utils/TextInputComponent';
import type { CivilHearingPayload } from './civil-types';
import { emptyHearing } from './civil-types';

type Props = {
  hearings: CivilHearingPayload[];
  onChange: (hearings: CivilHearingPayload[]) => void;
  title?: string;
};

export function HearingsEditor({ hearings, onChange, title = 'الجلسات' }: Props) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 14.5, color: 'primary.main' }}>{title}</Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Iconify icon="mingcute:add-line" width={16} />}
          onClick={() => onChange([...(hearings || []), emptyHearing()])}
          sx={{ fontWeight: 800, borderRadius: 2 }}
        >
          إضافة جلسة
        </Button>
      </Box>

      {(hearings || []).length === 0 ? (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 600, mb: 1 }}>
          لم تُضف جلسات بعد.
        </Typography>
      ) : (
        (hearings || []).map((hearing, index) => (
          <Box
            key={`hearing-${index}`}
            sx={{
              mb: 1.5,
              p: 2,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'grey.200',
              bgcolor: '#F8FAFC',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 13, color: 'primary.main' }}>
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
                  name="ملاحظات"
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
    </Box>
  );
}
