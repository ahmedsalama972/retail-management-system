import React, { useRef, useState } from 'react';
import { InputLabel, TextField, Box, InputAdornment, IconButton } from '@mui/material';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import {
  fieldContainerSx,
  formFieldErrorSx,
  formFieldSx,
  formInputLabelSx,
} from './field-styles';

interface TextInputComponentProps {
  name: string;
  value?: string | number;
  refState: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: string;
  [key: string]: any;
  helperText?: any;
  isDatePicker?: any;
}

const TextInputComponent: React.FC<TextInputComponentProps> = ({
  name,
  value,
  refState,
  required,
  type,
  isDatePicker,
  ...props
}) => {
  const placeHolder = name.replace('_', ' ');

  const textFieldRef = useRef<HTMLInputElement | null>(null);
  const [notvalidField, setNotValidField] = useState(false);
  const [pass, setPass] = useState(true);

  const regexText = /\p{L}/gu;
  const regexPassword = /^.{6,12}$/;
  const regexNumber = /^\d+$/;
  const regexPhone = /^\d{10}$/g;
  const regexMail = /\S+@\S+\.\w{2,}/;
  const regexUrl =
    /^https?:\/\/(?:www\.)?[-a-zA-Z\d@:%._+~#=]{1,256}\.[a-zA-Z\d()]{1,6}\b[-a-zA-Z\d()@:%_+.~#?&/=]*$/g;

  const updateSecureTextEntry = () => {
    setPass(!pass);
  };

  const updateRefState = (e: React.ChangeEvent<HTMLInputElement>) => {
    const testFields = (condition: RegExp) => {
      if (condition.test(textFieldRef.current?.value || '')) {
        refState(e);
        setNotValidField(false);
      } else {
        refState(e);
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
    } else {
      refState(e);
    }
  };

  return (
    <Box sx={fieldContainerSx}>
      <InputLabel sx={formInputLabelSx}>{placeHolder}</InputLabel>
      <TextField
        id={name}
        fullWidth
        size="medium"
        sx={[formFieldSx, ...(notvalidField ? [formFieldErrorSx] : [])] as any}
        placeholder={name ? `ادخل ${placeHolder}` : props?.placeholder ? props?.placeholder : ''}
        inputRef={textFieldRef}
        onChange={updateRefState}
        helperText={props?.helperText}
        type={type === 'password' && !pass ? 'text' : type}
        value={value ?? ''}
        {...props}
        InputProps={{
          autoComplete: 'off',
          endAdornment: isDatePicker || (
            <InputAdornment position="end">
              {type === 'password' ? (
                <IconButton onClick={updateSecureTextEntry} size="small" edge="end">
                  {pass ? <RemoveRedEyeIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                </IconButton>
              ) : null}
            </InputAdornment>
          ),
          inputProps: {
            style: { MozAppearance: 'textfield' },
            'data-disable-controls': 'true',
          },
        }}
      />
    </Box>
  );
};

export default TextInputComponent;
