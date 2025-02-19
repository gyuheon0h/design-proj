import React from 'react';
import { Dialog, DialogContent } from '@mui/material';

interface FileViewerDialogProps {
  open: boolean;
  onClose: () => void;
  src: string;
  fileType: string;
}

const FileViewerDialog: React.FC<FileViewerDialogProps> = ({
  open,
  onClose,
  src,
  fileType,
}) => {
  // Check if file is an image
  const isImage = fileType.startsWith('image/');

  // Check if file is a video
  const isVideo = fileType.startsWith('video/');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md">
      <DialogContent sx={{ textAlign: 'center' }}>
        {isImage ? (
          <img
            src={src}
            alt="preview"
            style={{ maxWidth: '100%', maxHeight: '80vh' }}
          />
        ) : isVideo ? (
          <video
            controls
            autoPlay
            style={{ maxWidth: '100%', maxHeight: '80vh' }}
          >
            <source src={src} type={fileType} />
            Your browser does not support the video tag.
          </video>
        ) : (
          <p>Unsupported file type</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FileViewerDialog;
