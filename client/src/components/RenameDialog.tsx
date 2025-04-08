import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Typography,
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
  const [baseName, setBaseName] = useState('');
  const [extension, setExtension] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setErrorMessage(''); // Reset error on dialog open
    if (resourceType === 'folder') {
      setBaseName(resourceName);
      setExtension('');
    } else {
      const splitName = resourceName.split('.');
      if (splitName.length === 1) {
        setBaseName(resourceName);
        setExtension('');
      } else {
        setBaseName(splitName.slice(0, -1).join('.'));
        setExtension(splitName.pop() || '');
      }
    }
  }, [resourceName, resourceType]);

  const handleRename = async () => {
    if (baseName.trim()) {
      setErrorMessage('');
      try {
        await axios.patch(
          `${process.env.REACT_APP_API_BASE_URL}/api/${resourceType}/${resourceId}/rename`,
          {
            resourceName:
              resourceType === 'folder' ? baseName : `${baseName}.${extension}`,
          },
          { withCredentials: true }
        );
        onSuccess();
        onClose();
      } catch (error: any) {
        if (
          error.response?.status === 400 &&
          error.response.data?.message === 'File name already exists in the directory'
        ) {
          setErrorMessage('A file or folder with that name already exists in this location.');
        } else {
          setErrorMessage('An unexpected error occurred. Please try again.');
        }
        console.error('Error renaming file:', error);
      }
    }
  };
  

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Rename {resourceName}</DialogTitle>
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
          error={!!errorMessage}
        />
        {resourceType === 'file' && (
          <TextField
            margin="dense"
            label="Extension"
            type="text"
            fullWidth
            variant="outlined"
            value={extension}
            disabled
          />
        )}
        {errorMessage && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {errorMessage}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={handleRename}
          color="primary"
          variant="contained"
          disabled={
            baseName.trim() === '' ||
            (resourceType === 'file' && `${baseName}${extension ? '.' + extension : ''}` === resourceName) ||
            (resourceType === 'folder' && baseName === resourceName)
          }
        >
          Rename
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenameDialog;
