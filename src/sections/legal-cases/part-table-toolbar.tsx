import type { ReactNode } from 'react';
import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Collapse from '@mui/material/Collapse';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';
import AutocompleteComponent from 'src/components/utils/AutoCompleteComponent';
import { FIELD_HEIGHT, fieldColors } from 'src/components/utils/field-styles';

type PartTableToolbarProps = {
  filterName: string;
  onFilterName: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  filterOpen?: boolean;
  onToggleFilter?: () => void;
  filterContent?: ReactNode;
  activeFilterCount?: number;
  companyOptions?: string[];
  selectedCompany?: string;
  onCompanyChange?: (company: string) => void;
  companyLabel?: string;
};

export function PartTableToolbar({
  filterName,
  onFilterName,
  placeholder,
  filterOpen,
  onToggleFilter,
  filterContent,
  activeFilterCount = 0,
  companyOptions,
  selectedCompany = '',
  onCompanyChange,
  companyLabel = 'الشركة',
}: PartTableToolbarProps) {
  const companyData = useMemo(
    () => (companyOptions || []).map((name) => ({ name })),
    [companyOptions]
  );
  const companyValue = useMemo(
    () => companyData.find((item) => item.name === selectedCompany) || null,
    [companyData, selectedCompany]
  );

  return (
    <Box>
      <Toolbar
        sx={{
          minHeight: 96,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
          p: (theme) => theme.spacing(0, 1, 0, 3),
        }}
      >
        <OutlinedInput
          value={filterName}
          onChange={onFilterName}
          placeholder={placeholder || 'بحث....'}
          startAdornment={
            <InputAdornment position="start">
              <Iconify width={20} icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          }
          sx={{
            maxWidth: 320,
            width: 1,
            height: FIELD_HEIGHT,
            minHeight: FIELD_HEIGHT,
            bgcolor: fieldColors.bg,
            borderRadius: 2,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: fieldColors.border },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: fieldColors.borderHover },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: fieldColors.borderFocus },
            '& input': { py: 0, height: FIELD_HEIGHT, boxSizing: 'border-box' },
          }}
        />
        {onCompanyChange && (
          <Box
            sx={{
              minWidth: 220,
              maxWidth: 280,
              width: 1,
              '& .MuiTextField-root': { mb: 0 },
            }}
          >
            <AutocompleteComponent
              name={companyLabel}
              value={companyValue}
              refState={(value: any) => {
                const next =
                  typeof value === 'string' ? value : value?.name || value?.company_name || '';
                onCompanyChange(next);
              }}
              data={companyData}
            />
          </Box>
        )}
        {onToggleFilter && (
          <Tooltip title="تصفية">
            <IconButton
              color={filterOpen || activeFilterCount > 0 ? 'primary' : 'default'}
              onClick={onToggleFilter}
              aria-label="تصفية"
              aria-expanded={filterOpen}
            >
              <Badge color="error" badgeContent={activeFilterCount || null}>
                <Iconify width={24} icon="ic:round-filter-list" />
              </Badge>
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>
      {filterContent && (
        <Collapse in={Boolean(filterOpen)} timeout="auto" unmountOnExit={false}>
          <Box sx={{ px: 3, pb: 3 }}>{filterContent}</Box>
        </Collapse>
      )}
    </Box>
  );
}
