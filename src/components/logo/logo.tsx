import type { BoxProps } from '@mui/material/Box';

import { forwardRef } from 'react';
import { useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';

import { RouterLink } from 'src/routes/components';

import { logoClasses } from './classes';

export type LogoProps = BoxProps & {
  href?: string;
  isSingle?: boolean;
  disableLink?: boolean;
};

export const Logo = forwardRef<HTMLDivElement, LogoProps>(
  (
    { width, href = '/legal-cases', height, isSingle = true, disableLink = false, className, sx, ...other },
    ref
  ) => {
    const location = useLocation();

    const singleLogo = (
      <Box
        alt="شعار النظام"
        component="img"
        src="/logo.png"
        sx={{ width: 1, height: 1, objectFit: 'contain' }}
      />
    );

    const fullLogo = (
      <Box
        alt="شعار النظام"
        component="img"
        src="/logo.png"
        sx={{ width: 1, height: 1, objectFit: 'contain' }}
      />
    );

    const baseSize = {
      width: width ?? 40,
      height: height ?? 40,
      ...(!isSingle && {
        width: width ?? 102,
        height: height ?? 36,
      }),
    };

    if (
      location.pathname === '/' ||
      location.pathname === '/404' ||
      location.pathname === '/register' ||
      location.pathname === '/dashboard'
    ) {
      return null;
    }

    return (
      <Box
        ref={ref}
        component={RouterLink}
        href={href}
        className={logoClasses.root.concat(className ? ` ${className}` : '')}
        aria-label="الشعار"
        sx={{
          ...baseSize,
          justifyContent: 'center',
          flexShrink: 0,
          display: 'inline-flex',
          verticalAlign: 'middle',
          ...(disableLink && { pointerEvents: 'none' }),
          ...sx,
        }}
        {...other}
      >
        {isSingle ? singleLogo : fullLogo}
      </Box>
    );
  }
);
