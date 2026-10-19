import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

type PartsTableHeadProps = {
  headLabel: Record<string, any>[];
};

export function PartsTableHead({ headLabel }: PartsTableHeadProps) {
  return (
    <TableHead>
      <TableRow
        sx={{
          bgcolor: '#F5F8FC',
          '& th': {
            borderBottom: '1px solid',
            borderColor: 'grey.200',
            py: 1.5,
          },
        }}
      >
        {headLabel.map((headCell) => (
          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }} key={headCell.id}>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 800,
                textAlign: 'right',
                color: 'text.secondary',
                letterSpacing: 0.2,
              }}
            >
              {headCell.label}
            </Typography>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}
