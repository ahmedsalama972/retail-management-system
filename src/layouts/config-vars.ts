import type { Theme } from '@mui/material/styles';

import { varAlpha } from 'src/theme/styles';

// ----------------------------------------------------------------------

export const baseVars = (theme: Theme) => ({
  // nav — light prosecution shell
  '--layout-nav-bg': '#F5F8FC',
  '--layout-nav-border-color': varAlpha(theme.vars.palette.grey['500Channel'], 0.1),
  '--layout-nav-zIndex': 1101,
  '--layout-nav-mobile-width': '300px',
  // nav item
  '--layout-nav-item-height': '48px',
  '--layout-nav-item-color': theme.vars.palette.grey[700],
  '--layout-nav-item-active-color': '#FFFFFF',
  '--layout-nav-item-active-bg': theme.vars.palette.primary.main,
  '--layout-nav-item-hover-bg': varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
  // header
  '--layout-header-blur': '12px',
  '--layout-header-zIndex': 1100,
  '--layout-header-mobile-height': '72px',
  '--layout-header-desktop-height': '80px',
});
