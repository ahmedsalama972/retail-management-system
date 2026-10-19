import type { TableRowProps } from '@mui/material/TableRow';

import Box from '@mui/material/Box';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

type TableNoDataProps = TableRowProps & {
  searchQuery: string;
};

export function TableNoData({ searchQuery, ...other }: TableNoDataProps) {
  return (
    <TableRow {...other}>
      <TableCell align="center" colSpan={12}>
        <Box sx={{ py: 15, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            لم يتم العثور على نتائج
          </Typography>
          <Typography variant="body2">
            لم يتم العثور على نتائج لـ &nbsp;
            <strong>&quot;{searchQuery}&quot;</strong>.
          </Typography>
        </Box>
      </TableCell>
    </TableRow>
  );
}
