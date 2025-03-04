import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
} from '@mui/material';
import axios from 'axios';

interface RenameDialogProps {
  open: boolean;
  fileName: string;
  fileId: string;
  resourceType: 'file' | 'folder';
  onClose: () => void;
  onSuccess: () => void;
}

const RenameDialog: React.FC<RenameDialogProps> = ({
  open,
  fileName,
  fileId,
  resourceType,
  onClose,
  onSuccess,
}) => {
  const [baseName, setBaseName] = useState('');
  const [extension, setExtension] = useState('');

  useEffect(() => {
    const splitName = fileName.split('.');
    setBaseName(splitName.slice(0, -1).join('.'));
    setExtension(splitName.pop() || '');
  }, [fileName]);

  const handleRename = async () => {
    if (baseName.trim()) {
      try {
        await axios.patch(
          `${process.env.REACT_APP_API_BASE_URL}/api/${resourceType}/rename/${fileId}`,
          { fileName: `${baseName}.${extension}` },
          { withCredentials: true }
        );
        onSuccess();
        onClose();
      } catch (error) {
        console.error('Error renaming file:', error);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Rename {fileName}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="New name"
          type="text"
          fullWidth
          variant="outlined"
          value={baseName}
          onChange={(e) => setBaseName(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Extension"
          type="text"
          fullWidth
          variant="outlined"
          value={extension}
          disabled
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">Cancel</Button>
        <Button
          onClick={handleRename}
          color="primary"
          variant="contained"
          disabled={baseName.trim() === ''}
        >
          Rename
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenameDialog;
