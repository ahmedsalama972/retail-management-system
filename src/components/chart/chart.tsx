import type { BoxProps } from '@mui/material/Box';

import { lazy, Suspense } from 'react';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { chartClasses } from './classes';

import type { ChartProps } from './types';

const ApexChart = lazy(() => import('react-apexcharts'));

// ----------------------------------------------------------------------

export function Chart({
  sx,
  type,
  series,
  height,
  options,
  className,
  width = '100%',
  ...other
}: BoxProps & ChartProps) {
  return (
    <Box
      dir="ltr"
      className={chartClasses.root.concat(className ? ` ${className}` : '')}
      sx={{
        width,
        height,
        flexShrink: 0,
        borderRadius: 1.5,
        position: 'relative',
        ...sx,
      }}
      {...other}
    >
      <Suspense
        fallback={
          <Box sx={{ height: 1, display: 'grid', placeItems: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        }
      >
        <ApexChart type={type} series={series} options={options} width="100%" height="100%" />
      </Suspense>
    </Box>
  );
}
