import * as React from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import { CheckOutlined } from '@mui/icons-material';

import { AppDialog } from 'src/components/utils/AppDialog';

interface ModalContainerProps {
  modalState: boolean;
  modalChangeState: (state: boolean) => void;
  children: React.ReactNode;
  modalTitle: string;
  modalSubtitle?: string;
  statusChip?: string;
  infoBanner?: string;
  modalAction?: () => void;
  btnTitle?: string;
  noClose?: boolean;
  deletbtnTitle?: string;
  deleteAction?: () => void;
  disabled?: boolean;
  endIcon?: React.ReactNode;
  modalStyle?: React.CSSProperties;
  btnStyle?: SxProps<Theme>;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

const ModalContainer: React.FC<ModalContainerProps> = ({
  modalState,
  modalChangeState,
  children,
  modalTitle,
  modalSubtitle,
  statusChip = 'قيد التسجيل',
  infoBanner,
  modalAction,
  btnTitle,
  noClose,
  deletbtnTitle,
  deleteAction,
  disabled,
  endIcon,
  modalStyle,
  btnStyle,
  maxWidth = 'sm',
}) => {
  const handleClose = () => modalChangeState(false);

  return (
    <AppDialog
      open={modalState}
      onClose={handleClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      statusChip={statusChip}
      infoBanner={infoBanner}
      hideClose={noClose}
      maxWidth={maxWidth}
      paperSx={modalStyle as SxProps<Theme>}
      primaryLabel={btnTitle}
      onPrimary={modalAction}
      primaryDisabled={disabled}
      primaryEndIcon={endIcon ?? <CheckOutlined />}
      primarySx={btnStyle}
      secondaryLabel={deletbtnTitle}
      onSecondary={deleteAction}
      secondarySx={
        deletbtnTitle
          ? {
              borderColor: '#FECACA',
              color: '#B91C1C',
              bgcolor: '#FEF2F2',
              '&:hover': { borderColor: '#FCA5A5', bgcolor: '#FEE2E2' },
            }
          : undefined
      }
    >
      {children}
    </AppDialog>
  );
};

export default ModalContainer;
