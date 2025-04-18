import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  List,
  ListItem,
  Input,
  Typography,
  Box,
  Paper,
} from '@mui/material';
import { typography } from '../Styles';
import DeleteIcon from '@mui/icons-material/Delete';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import axios from 'axios';

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  currentFolderId: string | null;
  onBatchUpload: (
    uploads: { file: File; relativePath: string }[],
  ) => Promise<void>;
}

type UploadFile = {
  file: File;
  relativePath: string;
};

const UploadDialog: React.FC<UploadDialogProps> = ({
  open,
  onClose,
  onBatchUpload,
  currentFolderId,
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const dropRef = useRef<HTMLDivElement>(null);

  const addFiles = async (
    newFiles: File[],
    getPath: (file: File) => string,
  ) => {
    const okUploads: UploadFile[] = [];
    const failedPaths: string[] = [];

    const existingPaths = new Set(files.map((f) => f.relativePath));
    const batchPaths = new Set<string>();

    for (const file of newFiles) {
      const relativePath = getPath(file);

      if (existingPaths.has(relativePath) || batchPaths.has(relativePath)) {
        continue;
      }

      try {
        // call your uniqueness endpoint
        await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/file/upload/${file.name}/unique`,
          {
            params: { parentFolder: currentFolderId },
            withCredentials: true,
          },
        );

        // if no error, it’s unique—queue it for upload
        okUploads.push({ file, relativePath });
      } catch (err: any) {
        // if the backend tells us “already exists”, collect it
        if (
          err.response?.status === 400 &&
          err.response.data?.message ===
            'File name already exists in the directory'
        ) {
          failedPaths.push(relativePath);
        } else {
          // any other error—log it and also treat it as “failed”
          console.error('Error checking file uniqueness', err);
          failedPaths.push(relativePath);
        }
      }
    }

    // if any failed, show them
    if (failedPaths.length > 0) {
      setErrorMessage(
        `These files already exist and were not added: ${failedPaths.join(
          ', ',
        )}`,
      );
    } else {
      setErrorMessage('');
    }

    // finally, add only the unique files into your dialog
    setFiles((prev) => [...prev, ...okUploads]);
  };

  const removeFileAtIndex = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length > 0) {
      addFiles(selected, (file) => file.name);
    }
    event.target.value = '';
  };

  const handleFolderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length > 0) {
      addFiles(selected, (file) => file.webkitRelativePath || file.name);
    }
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const items = event.dataTransfer.items;
    if (!items) return;

    const droppedFiles: UploadFile[] = [];

    const traverse = (item: any, path = ''): Promise<void> => {
      return new Promise((resolve) => {
        if (item.isFile) {
          item.file((file: File) => {
            const relativePath = path + file.name;
            const wrappedFile = new File([file], relativePath, {
              type: file.type,
            });
            droppedFiles.push({ file: wrappedFile, relativePath });
            resolve();
          });
        } else if (item.isDirectory) {
          const dirReader = item.createReader();
          dirReader.readEntries(async (entries: any[]) => {
            const promises = entries.map((entry) =>
              traverse(entry, path + item.name + '/'),
            );
            await Promise.all(promises);
            resolve();
          });
        }
      });
    };

    const handleItems = async () => {
      const entryPromises = [];
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry?.();
        if (entry) {
          entryPromises.push(traverse(entry));
        }
      }
      await Promise.all(entryPromises);
      setFiles((prev) => [...prev, ...droppedFiles]);
    };

    handleItems();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropRef.current) dropRef.current.style.border = '2px dashed #2196f3';
  };

  const handleDragLeave = () => {
    if (dropRef.current)
      dropRef.current.style.border = '2px dashed transparent';
  };

  const handleUpload = async () => {
    try {
      await onBatchUpload(files);
    } catch (err) {
      console.error(`Batch upload failed`, err);
    }
    setFiles([]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      sx={{ '& .MuiDialog-paper': { width: '100%' } }}
    >
      <DialogTitle sx={{ fontFamily: typography.fontFamily }}>
        Upload Files or Folders
      </DialogTitle>
      <DialogContent>
        {errorMessage && (
          <Alert
            severity="error"
            onClose={() => setErrorMessage('')}
            sx={{ mb: 2 }}
          >
            {errorMessage}. Please rename and try again.
          </Alert>
        )}

        <Box display="flex" gap={2} my={2}>
          <Button
            fullWidth
            variant="contained"
            component="label"
            sx={{ py: 2 }}
          >
            Select Files
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </Button>
          <Button
            fullWidth
            variant="contained"
            component="label"
            sx={{ py: 2 }}
          >
            Select Folder
            <input
              type="file"
              multiple
              onChange={handleFolderChange}
              style={{ display: 'none' }}
              {...{ webkitdirectory: 'true', directory: '' }}
            />
          </Button>
        </Box>

        <Paper
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          elevation={0}
          sx={{
            border: '2px dashed transparent',
            borderRadius: 2,
            p: 2,
            textAlign: 'center',
            color: '#888',
            mb: 2,
            transition: 'border 0.2s',
          }}
        >
          Drag & drop files or folders here
        </Paper>

        {files.length > 0 && (
          <>
            <Typography variant="subtitle1" gutterBottom>
              Files to Upload:
            </Typography>
            <List dense>
              {files.map(({ relativePath }, idx) => (
                <ListItem
                  key={idx}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => removeFileAtIndex(idx)}
                    >
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
            setFiles([]);
            onClose();
          }}
          sx={{ fontFamily: typography.fontFamily }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={files.length === 0}
          sx={{ fontFamily: typography.fontFamily }}
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadDialog;
