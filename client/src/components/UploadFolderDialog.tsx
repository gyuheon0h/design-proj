import React, { useState, useEffect, useRef } from 'react';
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
  Box,
  LinearProgress,
  Alert,
} from '@mui/material';

export type UploadFile = { file: File; relativePath: string };

interface UploadFolderDialogProps {
  open: boolean;
  onClose: () => void;
  currentFolderId: string | null;
}

export const UploadFolderDialog: React.FC<UploadFolderDialogProps> = ({
  open,
  onClose,
  currentFolderId,
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const addFiles = (newFiles: File[]) => {
    const existing = new Set(files.map((f) => f.relativePath));
    const batch: UploadFile[] = [];

    newFiles.forEach((file) => {
      const relativePath = file.webkitRelativePath || file.name;
      if (
        !relativePath.split('/').some((seg) => seg.startsWith('.')) &&
        !existing.has(relativePath)
      ) {
        batch.push({ file, relativePath });
      }
    });

    setFiles((prev) => [...prev, ...batch]);
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length) addFiles(selected);
    e.target.value = '';
  };

  // SSE subscription
  useEffect(() => {
    if (!uploadId) return;
    const es = new EventSource(
      `${process.env.REACT_APP_API_BASE_URL}/api/upload-folder/progress/${uploadId}`,
      { withCredentials: true },
    );
    es.onmessage = (e) => {
      try {
        // const msg = JSON.parse(e.data);
        // if (msg.type === 'folder-progress') {
        //   setProgress(msg.percent);
        // } else if (msg.type === 'complete') {
        //   setDone(true);
        //   es.close();
        // }
      } catch (err) {
        console.error('SSE parse error', err);
      }
    };
    es.onerror = (err) => {
      console.error('SSE error', err);
      setUploadError('Progress stream failed');
      es.close();
    };
    return () => es.close();
  }, [uploadId]);

  const handleUpload = async () => {
    try {
      // start session
      // const {
      //   data: { uploadId: id },
      // } = await axios.post(
      //   `${process.env.REACT_APP_API_BASE_URL}/api/upload-folder/start`,
      //   { parentFolder: currentFolderId },
      //   { withCredentials: true },
      // );
      // setUploadId(id);

      const formData = new FormData();
      files.forEach(({ file, relativePath }) => {
        formData.append('files', file, relativePath);
      });
      // formData.append('uploadId', id);
      abortController.current = new AbortController();
      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/folder/upload`,
        formData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
          signal: abortController.current.signal,
        },
      );
    } catch (err: any) {
      if (axios.isCancel(err)) {
        console.warn('Upload cancelled');
        setUploadError('Upload cancelled');
      } else {
        console.error('Upload failed', err);
        setUploadError('Upload failed');
      }
    }
  };

  // const uploading = !!uploadId && !done && !uploadError;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Upload Folder</DialogTitle>
      <DialogContent>
        {uploadError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {uploadError}
          </Alert>
        )}
        <Button variant="contained" component="label" sx={{ my: 2 }}>
          Select a Folder
          <input
            type="file"
            multiple
            hidden
            {...{ webkitdirectory: 'true', directory: '' }}
            onChange={handleUpload}
          />
        </Button>
      </DialogContent>
    </Dialog>
  );
};
