import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';
import axios from 'axios';

interface RenameDialogProps {
  open: boolean;
  fileName: string;
  fileId: string;
  resourceType: 'folder' | 'file';
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
  const [newFileName, setNewFileName] = useState(fileName);

  useEffect(() => {
    setNewFileName(fileName);
  }, [fileName]);

  const handleRename = async () => {
    if (newFileName.trim()) {
      try {
        if (resourceType === 'file') {
          await axios.patch(
            `http://localhost:5001/api/file/rename/${fileId}`,
            { fileName: newFileName },
            { withCredentials: true },
          );
        }

        if (resourceType === 'folder') {
          await axios.patch(
            `http://localhost:5001/api/folder/rename/${fileId}`,
            { folderName: newFileName },
            { withCredentials: true },
          );
        }

        onSuccess();
      } catch (error) {
        console.error('Error renaming folder:', error);
      }
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

export default RenameDialog;
