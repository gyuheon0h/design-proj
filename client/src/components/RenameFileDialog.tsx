import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from '@mui/material';

interface RenameFileDialogProps {
  open: boolean;
  fileName: string;
  onClose: () => void;
  onFileRename: (fileName: string) => void;
}

function parseFileName(fileName: string) {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) {
    return {
      baseName: fileName,
      extension: '',
    };
  }
  return {
    baseName: fileName.slice(0, lastDot),
    extension: fileName.slice(lastDot),
  };
}

const RenameFileDialog: React.FC<RenameFileDialogProps> = ({
  open,
  fileName,
  onClose,
  onFileRename,
}) => {
  const [baseName, setBaseName] = useState(fileName);

  useEffect(() => {
    setBaseName(fileName);
  }, [fileName]);

  const handleRename = () => {
    if (baseName.trim()) {
      onFileRename(baseName);
      onClose();
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">Cancel</Button>
        <Button
          onClick={handleRename}
          color="primary"
          variant="contained"
          disabled={baseName.trim() === fileName.trim()}
        >
          Rename
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenameFileDialog;
