import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
} from '@mui/material';

interface FolderDialogProps {
  open: boolean;
  onClose: () => void;
  currentFolderId: string | null;
  onFolderCreate: (folderName: string, parentFolder: string | null) => Promise<void>;
}

const FolderDialog: React.FC<FolderDialogProps> = ({
  open,
  currentFolderId,
  onClose,
  onFolderCreate,
}) => {
  const [folderName, setFolderName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleCreate = async () => {
    if (folderName.trim()) {
      setErrorMessage('');
      try {
        await onFolderCreate(folderName, currentFolderId);
        setFolderName('');
        onClose();
      } catch (error: any) {
        if (
          error.response?.status === 400 
        ) {
          setErrorMessage('A folder with that name already exists here.');
        } else {
          setErrorMessage('An unexpected error occurred while creating the folder.');
        }
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create New Folder</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Folder Name"
          type="text"
          fullWidth
          variant="outlined"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          error={!!errorMessage}
        />
        {errorMessage && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {errorMessage}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setFolderName('');
            setErrorMessage('');
            onClose();
          }}
          color="primary"
        >
          Cancel
        </Button>
        <Button onClick={handleCreate} color="primary" variant="contained">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FolderDialog;
