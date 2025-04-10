import React, { useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Input,
  Typography,
} from '@mui/material';
import { typography } from '../Styles';

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onFileUpload: (file: Blob | File, fileName: string) => Promise<void>;
}

const UploadDialog: React.FC<UploadDialogProps> = ({
  open,
  onClose,
  onFileUpload,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setNewFileName(selectedFile.name);
      setErrorMessage('');
    }
  };

  const handleUploadClick = async () => {
    if (file) {
      setErrorMessage('');
      try {
        await onFileUpload(file, newFileName);
        setFile(null);
        setNewFileName('');
        onClose();
      } catch (error: any) {
        if (
          error.response?.status === 400 &&
          error.response.data?.message === 'File name already exists in the directory'
        ) {
          setErrorMessage('A file with that name already exists in this folder.');
        } else {
          setErrorMessage('An unexpected error occurred during upload.');
        }
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ fontFamily: typography.fontFamily }}>
        Upload New File
      </DialogTitle>
      <DialogContent>
        <Input type="file" onChange={handleFileChange} fullWidth />
        <TextField
          margin="dense"
          id="file-name"
          label="File Name"
          type="text"
          fullWidth
          variant="outlined"
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
          disabled={!file}
          error={!!errorMessage}
        />
        {errorMessage && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {errorMessage}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setNewFileName('');
            setFile(null);
            setErrorMessage('');
            onClose();
          }}
          sx={{ fontFamily: typography.fontFamily }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUploadClick}
          disabled={!file}
          sx={{ fontFamily: typography.fontFamily }}
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadDialog;
