import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';

interface RenameFileDialogProps {
  open: boolean;
  fileName: string;
  onClose: () => void;
  onFileRename: (fileName: string) => void;
}

const RenameFileDialog: React.FC<RenameFileDialogProps> = ({
  open,
  fileName,
  onClose,
  onFileRename,
}) => {
  const [currentFileName, setCurrentFileName] = useState(fileName);

  useEffect(() => {
    if (open) {
      setCurrentFileName(fileName);
    }
  }, [fileName, open]);

  const handleRename = () => {
    if (currentFileName.trim()) {
      onFileRename(currentFileName);
      setCurrentFileName(fileName);
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
          label={currentFileName}
          type="text"
          fullWidth
          variant="outlined"
          value={fileName}
          onChange={(e) => setCurrentFileName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleRename} color="primary" variant="contained">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenameFileDialog;
