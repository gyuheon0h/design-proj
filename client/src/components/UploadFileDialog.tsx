import React, { useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Input,
} from '@mui/material';
import { typography } from '../Styles';

interface UploadFileDialogProps {
  open: boolean;
  onClose: () => void;
  onFileUpload: (file: Blob | File, fileName: string) => Promise<void>;
}

const UploadFileDialog: React.FC<UploadFileDialogProps> = ({
  open,
  onClose,
  onFileUpload,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [newFileName, setNewFileName] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setNewFileName(selectedFile.name); // Set initial file name
    }
  };

  const handleUploadClick = async () => {
    if (file) {
      try {
        await onFileUpload(file, newFileName);
        setFile(null);
        setNewFileName('');
        onClose();
      } catch (error) {
        console.error('File upload failed:', error);
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
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setNewFileName('');
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

export default UploadFileDialog;
