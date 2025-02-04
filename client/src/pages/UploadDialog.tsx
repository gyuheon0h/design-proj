import React, { useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button } from '@mui/material';
import { typography } from '../Styles'; 

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onFileUpload: (fileName: string) => void;
}

const UploadDialog: React.FC<UploadDialogProps> = ({ open, onClose, onFileUpload }) => {
  const [newFileName, setNewFileName] = useState('');

  const handleUpload = () => {
    if (newFileName.trim() !== '') {
      onFileUpload(newFileName);
      setNewFileName('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ fontFamily: typography.fontFamily }}>Upload New File</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="file-name"
          label="File Name"
          type="text"
          fullWidth
          variant="outlined"
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ fontFamily: typography.fontFamily }}>Cancel</Button>
        <Button onClick={handleUpload} sx={{ fontFamily: typography.fontFamily }}>Upload</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadDialog;
