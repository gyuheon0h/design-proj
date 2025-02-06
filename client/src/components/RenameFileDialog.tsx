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
  const { baseName: initialBaseName, extension } = parseFileName(fileName);
  const [baseName, setBaseName] = useState(initialBaseName);

  useEffect(() => {
    const { baseName: parsedBaseName } = parseFileName(fileName);
    setBaseName(parsedBaseName);
  }, [fileName]);

  const handleRename = () => {
    if (baseName.trim()) {
      onFileRename(baseName + extension);
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
          label={initialBaseName}
          type="text"
          fullWidth
          variant="outlined"
          value={baseName}
          onChange={(e) => setBaseName(e.target.value)}
        />
        <Box mt={2} component="span">
          Extension: {extension}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={handleRename}
          color="primary"
          variant="contained"
          disabled={baseName.trim() === initialBaseName.trim()}
        >
          Rename
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenameFileDialog;
