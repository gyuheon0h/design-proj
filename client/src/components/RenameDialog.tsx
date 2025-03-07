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
  resourceName: string;
  resourceId: string;
  resourceType: 'folder' | 'file';
  onClose: () => void;
  onSuccess: () => void;
}

const RenameDialog: React.FC<RenameDialogProps> = ({
  open,
  resourceName,
  resourceId,
  resourceType,
  onClose,
  onSuccess,
}) => {
  const [newresourceName, setNewresourceName] = useState(resourceName);

  useEffect(() => {
    setNewresourceName(resourceName);
  }, [resourceName]);

  const handleRename = async () => {
    if (newresourceName.trim()) {
      try {
        if (resourceType === 'file') {
          await axios.patch(
            `${process.env.REACT_APP_API_BASE_URL}/api/file/${resourceId}/rename`,
            { fileName: newresourceName },
            { withCredentials: true },
          );
        }

        if (resourceType === 'folder') {
          await axios.patch(
            `${process.env.REACT_APP_API_BASE_URL}/api/folder/${resourceId}/rename`,
            { folderName: newresourceName },
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
      <DialogTitle>Rename {resourceName}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={newresourceName}
          type="text"
          fullWidth
          variant="outlined"
          value={newresourceName}
          onChange={(e) => setNewresourceName(e.target.value)}
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
          disabled={newresourceName.trim() === resourceName.trim()}
        >
          Rename
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenameDialog;
