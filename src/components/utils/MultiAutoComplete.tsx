import * as React from 'react';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { Box, InputLabel } from '@mui/material';
import { debounce } from 'lodash';

import { autocompleteRtlSx, fieldContainerSx, formFieldSx, formInputLabelSx } from './field-styles';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export default function CheckboxesTags({
  name,
  value,
  refState,
  onScrollEnd,
  data,
  ...props
}: any) {
  const placeHolder = name.replace('_', ' ');
  const textFieldRef = React.useRef<HTMLInputElement>(null);

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
        multiple
        id="checkboxes-tags-demo"
        options={Array.isArray(data) ? data : []}
        disableCloseOnSelect
        getOptionLabel={(option: any) => `Machine - ${option?.machine_number} - ${option?.brand || ''}`}
        value={Array.isArray(value) ? value : []}
        renderOption={(oprops, option, { selected }) => {
          const { key, ...optionProps } = oprops;
          return (
            <li key={key} {...optionProps} style={{ ...(optionProps.style || {}), direction: 'rtl', textAlign: 'right' }}>
              <Checkbox icon={icon} checkedIcon={checkedIcon} style={{ marginLeft: 8, marginRight: 0 }} checked={selected} />
              {`Machine - ${option.machine_number} - ${option.brand}`}
            </li>
          );
        }}
        onChange={refState}
        ListboxProps={{
          onScroll: handleScrollDebounced as unknown as React.UIEventHandler<HTMLUListElement>,
          style: { direction: 'rtl', textAlign: 'right' },
        }}
        sx={{
          width: '100%',
          ...autocompleteRtlSx,
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            {...props}
            fullWidth
            size="medium"
            sx={[formFieldSx, autocompleteRtlSx] as any}
            inputRef={textFieldRef}
            placeholder={`ادخل ${placeHolder}`}
            inputProps={{
              ...params.inputProps,
              dir: 'rtl',
              style: { ...(params.inputProps as any)?.style, textAlign: 'right', direction: 'rtl' },
            }}
          />
        )}
      />
    </Box>
  );
}
