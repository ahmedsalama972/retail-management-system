import type { SxProps, Theme } from '@mui/material/styles';

/** Shared control height for text + select/autocomplete fields */
export const FIELD_HEIGHT = 48;

export const fieldColors = {
  bg: '#FFFFFF',
  border: '#E2E8F0',
  borderHover: '#CBD5E1',
  borderFocus: '#1A2942',
  label: '#1E293B',
};

/** Space for clear + popup icons on the physical left in RTL selects */
export const AUTOCOMPLETE_ADORNMENT_WIDTH = 68;

export const formInputLabelSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  transform: 'translate(0,0) scale(1)',
  color: fieldColors.label,
  fontSize: 13,
  fontWeight: 700,
  width: 'max-content',
  mb: 0.85,
  px: 0,
};

/** Shared outline shell — same border / fill / radius as TextField */
const outlinedShellSx: SxProps<Theme> = {
  minHeight: FIELD_HEIGHT,
  height: FIELD_HEIGHT,
  boxSizing: 'border-box',
  backgroundColor: fieldColors.bg,
  borderRadius: 2,
  alignItems: 'center',
  '& fieldset, & .MuiOutlinedInput-notchedOutline': {
    borderColor: fieldColors.border,
    borderWidth: '1px !important',
    legend: {
      // Continuous outline (no floating-label notch) — matches unlabeled TextField
      maxWidth: '0.01px !important',
      padding: 0,
      width: 0,
      span: { display: 'none' },
    },
  },
  '&:hover fieldset, &:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: fieldColors.borderHover,
  },
  '&.Mui-focused fieldset, &.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: `${fieldColors.borderFocus} !important`,
    borderWidth: '1px !important',
  },
};

/**
 * RTL layout for Autocomplete/Select:
 * icons on the left, Arabic text on the right, no overlap.
 * Outline matches TextField exactly.
 */
export const autocompleteRtlSx: SxProps<Theme> = {
  direction: 'rtl',
  '& .MuiOutlinedInput-root': {
    ...outlinedShellSx,
    py: '0 !important',
    // Keep flex LTR so absolute endAdornment positioning stays predictable
    direction: 'ltr',
    paddingTop: '0 !important',
    paddingBottom: '0 !important',
    paddingLeft: `${AUTOCOMPLETE_ADORNMENT_WIDTH}px !important`,
    paddingRight: '14px !important',
  },
  '& .MuiAutocomplete-inputRoot': {
    flexWrap: 'nowrap',
  },
  '& .MuiAutocomplete-input': {
    py: '0 !important',
    px: '0 !important',
    height: `${FIELD_HEIGHT - 2}px !important`,
    minHeight: `${FIELD_HEIGHT - 2}px !important`,
    boxSizing: 'border-box',
    textAlign: 'right',
    direction: 'rtl',
  },
  '& .MuiAutocomplete-endAdornment': {
    position: 'absolute',
    right: 'auto !important',
    left: '6px !important',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  '& .MuiAutocomplete-clearIndicator, & .MuiAutocomplete-popupIndicator': {
    p: 0.5,
    margin: 0,
  },
};

/** Applied to TextField / Autocomplete TextField wrappers */
export const formFieldSx: SxProps<Theme> = {
  display: 'flex',
  width: '100%',
  m: 0,
  mb: 2,
  transition: 'all 0.2s ease',
  '& .MuiFormHelperText-root': {
    display: 'none',
    color: 'error.main',
    m: 0,
    mt: 0.5,
    mx: 0.5,
  },
  '& .MuiOutlinedInput-root': {
    ...outlinedShellSx,
    transition: 'border-color 0.2s ease',
  },
  '& .MuiOutlinedInput-input': {
    py: 0,
    px: 1.75,
    height: FIELD_HEIGHT,
    boxSizing: 'border-box',
    fontSize: 14,
    fontWeight: 500,
    lineHeight: `${FIELD_HEIGHT}px`,
    textAlign: 'right',
    direction: 'rtl',
  },
  '& input[type="date"], & input[type="time"], & input[type="datetime-local"], & input[type="number"]': {
    height: FIELD_HEIGHT,
    lineHeight: `${FIELD_HEIGHT}px`,
  },
  '& .MuiInputAdornment-root': {
    height: FIELD_HEIGHT - 2,
    maxHeight: FIELD_HEIGHT - 2,
  },
  '& .MuiAutocomplete-inputRoot': {
    ...outlinedShellSx,
    minHeight: `${FIELD_HEIGHT}px !important`,
    height: `${FIELD_HEIGHT}px !important`,
    py: '0 !important',
    direction: 'ltr',
    paddingLeft: `${AUTOCOMPLETE_ADORNMENT_WIDTH}px !important`,
    paddingRight: '14px !important',
    flexWrap: 'nowrap',
  },
  '& .MuiAutocomplete-input': {
    py: '0 !important',
    px: '0 !important',
    height: `${FIELD_HEIGHT - 2}px !important`,
    minHeight: `${FIELD_HEIGHT - 2}px !important`,
    boxSizing: 'border-box',
    textAlign: 'right',
    direction: 'rtl',
  },
  '& .MuiAutocomplete-endAdornment': {
    position: 'absolute',
    right: 'auto !important',
    left: '6px !important',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  '& .MuiSelect-select': {
    py: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: `${FIELD_HEIGHT - 2}px !important`,
    height: `${FIELD_HEIGHT - 2}px !important`,
    boxSizing: 'border-box',
    textAlign: 'right',
    direction: 'rtl',
    paddingLeft: '32px !important',
    paddingRight: '14px !important',
  },
  '& .MuiSelect-icon': {
    right: 'auto',
    left: 7,
  },
};

export const formFieldErrorSx: SxProps<Theme> = {
  '& .MuiFormHelperText-root': {
    display: 'flex',
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset, & .MuiOutlinedInput-notchedOutline': {
      borderColor: 'error.main !important',
    },
  },
};

export const fieldContainerSx: SxProps<Theme> = {
  position: 'relative',
  width: '100%',
};
