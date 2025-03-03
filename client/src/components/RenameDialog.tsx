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
  const [newResourceName, setnewResourceName] = useState(resourceName);

  useEffect(() => {
    setnewResourceName(resourceName);
  }, [resourceName]);

  const handleRename = async () => {
    if (newResourceName.trim()) {
      try {
        await axios.patch(
          `${process.env.REACT_APP_API_BASE_URL}/api/${resourceType}/${resourceId}/rename`,
          { resourceName: newResourceName },
          { withCredentials: true },
        );
        onSuccess();
      } catch (error) {
        console.error('Error renaming resource:', error);
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
          label={newResourceName}
          type="text"
          fullWidth
          variant="outlined"
          value={newResourceName}
          onChange={(e) => setnewResourceName(e.target.value)}
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
          disabled={newResourceName.trim() === resourceName.trim()}
        >
          Rename
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenameDialog;
