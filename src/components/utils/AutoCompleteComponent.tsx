import { useRef, useState } from 'react';
import {
  InputLabel,
  TextField,
  Box,
  Autocomplete,
  CircularProgress,
  SxProps,
  Theme,
} from '@mui/material';
import { debounce } from 'lodash';

import {
  autocompleteRtlSx,
  fieldContainerSx,
  formFieldErrorSx,
  formFieldSx,
  formInputLabelSx,
} from './field-styles';

interface AutocompleteComponentProps {
  name: string;
  value: any;
  refState: React.Dispatch<React.SetStateAction<any>> | React.RefObject<any>;
  required?: boolean;
  type?: string;
  textStyle?: SxProps<Theme>;
  onScrollEnd?: () => void;
  data: any[] | undefined;
  isLoading?: boolean;
  helperText?: string;
  [x: string]: any;
}

const AutocompleteComponent: React.FC<AutocompleteComponentProps> = ({
  name,
  value,
  refState,
  required = false,
  type = 'text',
  onScrollEnd,
  data,
  isLoading = false,
  helperText,
}: AutocompleteComponentProps) => {
  const placeHolder = name.replace('_', ' ');
  const textFieldRef = useRef<HTMLInputElement>(null);
  const [notvalidField, setNotValidField] = useState(false);

  const regexText = /\w/g;
  const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%]).{6,}$/;
  const regexNumber = /^\d+$/;
  const regexPhone = /^\d\d{10}$/g;
  const regexMail = /\S+@\S+\.\w{2,}/;
  const regexUrl =
    /^https?:\/\/(?:www\.)?[-a-zA-Z\d@:%._+~#=]{1,256}\.[a-zA-Z\d()]{1,6}\b[-a-zA-Z\d()@:%_+.~#?&/=]*$/g;

  const updateRefState = (_event: any, newValue: any) => {
    const testFields = (condition: RegExp) => {
      if (condition.test(textFieldRef.current?.value || '')) {
        if (typeof refState === 'function') refState(newValue);
        setNotValidField(false);
      } else {
        setNotValidField(true);
      }
    };

    if (required) {
      switch (type) {
        case 'text':
          testFields(regexText);
          break;
        case 'password':
          testFields(regexPassword);
          break;
        case 'number':
          testFields(regexNumber);
          break;
        case 'phone':
          testFields(regexPhone);
          break;
        case 'email':
          testFields(regexMail);
          break;
        case 'url':
          testFields(regexUrl);
          break;
        default:
          break;
      }
    } else if (typeof refState === 'function') {
      refState(newValue);
    }
  };

  const handleScroll = (event: any) => {
    const bottom = event.target.scrollHeight - event.target.scrollTop <= event.target.clientHeight + 100;
    if (bottom && onScrollEnd) {
      onScrollEnd();
    }
  };

  const handleScrollDebounced = debounce(handleScroll, 200);

  return (
    <Box sx={fieldContainerSx}>
      <InputLabel sx={formInputLabelSx}>{placeHolder}</InputLabel>
      <Autocomplete
        freeSolo
        options={data || []}
        getOptionLabel={(option) => option?.name || option?.brand || option?.part_number || option || ''}
        value={value ?? null}
        onChange={updateRefState}
        ListboxProps={{
          onScroll: handleScrollDebounced as unknown as React.UIEventHandler<HTMLUListElement>,
          style: { direction: 'rtl', textAlign: 'right' },
        }}
        componentsProps={{
          paper: {
            sx: { direction: 'rtl' },
          },
        }}
        sx={{
          width: '100%',
          ...autocompleteRtlSx,
        }}
        renderOption={(props, option) => (
          <li {...props} style={{ ...(props.style || {}), direction: 'rtl', textAlign: 'right' }}>
            {option?.name || option?.brand || option?.part_number || option || ''}
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth
            size="medium"
            variant="outlined"
            label={undefined}
            sx={[formFieldSx, autocompleteRtlSx, ...(notvalidField ? [formFieldErrorSx] : [])] as any}
            placeholder={`ادخل ${placeHolder}`}
            inputRef={textFieldRef}
            helperText={helperText}
            type={type}
            inputProps={{
              ...params.inputProps,
              dir: 'rtl',
              style: { ...(params.inputProps as any)?.style, textAlign: 'right', direction: 'rtl' },
            }}
            InputProps={{
              ...params.InputProps,
              notched: false,
              endAdornment: (
                <>
                  {isLoading ? <CircularProgress color="inherit" size={18} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    </Box>
  );
};

export default AutocompleteComponent;
