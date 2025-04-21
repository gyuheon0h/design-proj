// ==== UploadFolderDialog.tsx ====
import React, { useState } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  Typography,
  IconButton,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export type UploadFile = { file: File; relativePath: string };

interface UploadFolderDialogProps {
  open: boolean;
  onClose: () => void;
  currentFolderId: string | null;
  onBatchUpload: (
    uploads: UploadFile[],
    folderPathToFolderId?: Map<string, string>,
  ) => Promise<void>;
}

export const UploadFolderDialog: React.FC<UploadFolderDialogProps> = ({
  open,
  onClose,
  currentFolderId,
  onBatchUpload,
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // handle folder selection and build the list of files with relative paths
  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const uploads: UploadFile[] = selectedFiles
      .filter((file) => {
        const path = file.webkitRelativePath || file.name;
        return !path.split('/').some((seg) => seg.startsWith('.'));
      })
      .map((file) => ({
        file,
        relativePath: file.webkitRelativePath || file.name,
      }));

    setFiles(uploads);
    setErrorMessage('');
    e.target.value = '';
  };

  const removeFileAtIndex = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const clearFiles = () => setFiles([]);

  const handleUpload = async () => {
    if (!files.length) return;
    try {
      // determine root folder name (first segment of any file path)
      const rootFolderName = files[0].relativePath.split('/')[0];

      // create root folder in metadata
      const { data: createRes } = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/folder/create`,
        { name: rootFolderName, parentFolder: currentFolderId },
        { withCredentials: true },
      );
      const rootFolderId: string = createRes.id;

      // collect unique subfolder paths relative to root
      const folderPathSet = new Set<string>();
      files.forEach(({ relativePath }) => {
        const segments = relativePath.split('/');
        segments.pop(); // drop filename
        const subPath = segments.slice(1).join('/');
        if (subPath) folderPathSet.add(subPath);
      });
      const folderPaths = Array.from(folderPathSet);

      // clone folder hierarchy on server
      const { data: cloneRes } = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/folder/upload/clone-hierarchy`,
        { folderPaths, rootFolderId },
        { withCredentials: true },
      );
      const folderPathToFolderId = new Map<string, string>(
        Object.entries(cloneRes.folderPathToFolderId),
      );

      // delegate to parent handler to upload files under correct folder IDs
      await onBatchUpload(files, folderPathToFolderId);

      // cleanup and close
      clearFiles();
      onClose();
    } catch (err: any) {
      console.error('Upload folder error:', err);
      setErrorMessage(
        err.response?.data?.message ||
          'Failed to upload folder. Please try again.',
      );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Upload Folder</DialogTitle>
      <DialogContent>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}
        <Button variant="contained" component="label" sx={{ my: 2 }}>
          Select Folder
          <input
            type="file"
            multiple
            hidden
            {...{ webkitdirectory: 'true', directory: '' }}
            onChange={handleFolderChange}
          />
        </Button>
        {files.length > 0 && (
          <>
            <Typography variant="subtitle1" gutterBottom>
              Files to upload:
            </Typography>
            <List>
              {files.map(({ relativePath }, idx) => (
                <ListItem
                  key={idx}
                  secondaryAction={
                    <IconButton onClick={() => removeFileAtIndex(idx)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  📄 {relativePath}
                </ListItem>
              ))}
            </List>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            clearFiles();
            onClose();
          }}
        >
          Cancel
        </Button>
        <Button onClick={handleUpload} disabled={!files.length}>
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
};
