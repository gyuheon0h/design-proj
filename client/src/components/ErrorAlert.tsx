import React from 'react';
import { Snackbar, Alert } from '@mui/material';

interface ErrorAlertProps {
  open: boolean;
  message: string;
  severity?: 'error' | 'warning' | 'info' | 'success';
  onClose: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({
  open,
  message,
  severity = 'error',
  onClose,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default ErrorAlert;
