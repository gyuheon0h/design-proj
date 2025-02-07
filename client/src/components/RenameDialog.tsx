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

interface RenameDialogProps {
  open: boolean;
  fileName: string;
  onClose: () => void;
  onRename: (fileName: string) => void;
}

const RenameFileDialog: React.FC<RenameDialogProps> = ({
  open,
  fileName,
  onClose,
  onRename,
}) => {
  const [newFileName, setNewFileName] = useState(fileName);

  useEffect(() => {
    setNewFileName(fileName);
  }, [fileName]);

  const handleRename = () => {
    if (newFileName.trim()) {
      onRename(newFileName);
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
          label={newFileName}
          type="text"
          fullWidth
          variant="outlined"
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={handleRename}
          color="primary"
          variant="contained"
          disabled={newFileName.trim() === fileName.trim()}
        >
          Rename
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenameFileDialog;
