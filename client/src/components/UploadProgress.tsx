import React, { useEffect, useRef, useState } from 'react';
import {
  Snackbar,
  Alert,
  IconButton,
  Typography,
  Box,
  LinearProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { useSSEUploadProgress } from '../utils/uploadHook';

interface UploadProgressToastProps {
  file: File;
  parentFolder: string | null;
  userId: string;
  onClose: () => void;
  refreshFiles: (folderId: string | null) => void;
  refreshStorage: () => Promise<void>;
}

const UploadProgressToast: React.FC<UploadProgressToastProps> = ({
  file,
  parentFolder,
  userId,
  onClose,
  refreshFiles,
  refreshStorage,
}) => {
  const { progress, done, error, startListening, stopListening } =
    useSSEUploadProgress();
  const hasStarted = useRef(false);
  const abortController = useRef<AbortController | null>(null);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    const uploadFile = async () => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('parentFolder', parentFolder ?? '');

      abortController.current = new AbortController();

      try {
        await axios.post(
          `${process.env.REACT_APP_API_BASE_URL}/api/file/upload`,
          formData,
          {
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' },
            signal: abortController.current.signal,
          },
        );
      } catch (err: any) {
        if (axios.isCancel(err) || err.name === 'CanceledError') {
          console.warn('Upload cancelled by user');
        } else {
          console.error('Upload failed:', err);
        }
      }
    };

    if (!hasStarted.current) {
      hasStarted.current = true;
      startListening(userId);
      uploadFile();
    }
  }, [file, userId, parentFolder, startListening]);

  useEffect(() => {
    if (done && !cancelled) {
      refreshFiles(parentFolder);
      refreshStorage();
      setTimeout(onClose, 4000);
    }
  }, [cancelled, done, onClose, parentFolder, refreshFiles, refreshStorage]);

  const handleCancel = () => {
    abortController.current?.abort();
    stopListening();
    setCancelled(true);
    setTimeout(onClose, 4000);
  };

  return (
    <Snackbar
      open
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      sx={{ bottom: { xs: 90, sm: 100 } }}
    >
      <Alert
        severity={
          cancelled ? 'warning' : error ? 'error' : done ? 'success' : 'info'
        }
        sx={{ width: '100%', minWidth: 300 }}
        action={
          done || error || cancelled ? (
            <IconButton
              aria-label="close"
              size="small"
              onClick={onClose}
              color="inherit"
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          ) : (
            <IconButton
              aria-label="cancel"
              size="small"
              onClick={handleCancel}
              color="inherit"
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          )
        }
      >
        <Typography variant="body2">
          {cancelled
            ? `Upload cancelled: ${file.name}`
            : done
              ? `Upload complete: ${file.name}`
              : error
                ? `Upload failed: ${file.name}`
                : `Uploading: ${file.name}`}
        </Typography>

        {!done && !error && !cancelled && progress !== null && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption">{progress}%</Typography>
          </Box>
        )}
      </Alert>
    </Snackbar>
  );
};

export default UploadProgressToast;
