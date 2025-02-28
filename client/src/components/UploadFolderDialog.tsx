import React, { useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Input,
} from '@mui/material';
import { typography } from '../Styles';

interface UploadFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onFolderUpload: (files: File[], folderName: string) => Promise<void>;
}

const UploadFolderDialog: React.FC<UploadFolderDialogProps> = ({
  open,
  onClose,
  onFolderUpload,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [folderName, setFolderName] = useState('');

  const handleFolderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFiles = Array.from(event.target.files);
      setFiles(selectedFiles);

      if (selectedFiles.length > 0) {
        const pathParts = selectedFiles[0].webkitRelativePath.split('/');
        if (pathParts.length > 1) {
          setFolderName(pathParts[0]);
        } else {
          setFolderName('');
        }
      }
    }
  };

  const handleUploadClick = async () => {
    if (files.length > 0) {
      try {
        await onFolderUpload(files, folderName);
        setFiles([]);
        setFolderName('');
        onClose();
      } catch (error) {
        console.error('Folder upload failed:', error);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ fontFamily: typography.fontFamily }}>
        Upload New Folder
      </DialogTitle>
      <DialogContent>
        <Input
          type="file"
          onChange={handleFolderChange}
          inputProps={{ webkitdirectory: 'true' }}
          fullWidth
        />
        <TextField
          margin="dense"
          id="folder-name"
          label="Folder Name"
          type="text"
          fullWidth
          variant="outlined"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          disabled={files.length === 0}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setFiles([]);
            setFolderName('');
            onClose();
          }}
          sx={{ fontFamily: typography.fontFamily }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUploadClick}
          disabled={files.length === 0}
          sx={{ fontFamily: typography.fontFamily }}
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadFolderDialog;
