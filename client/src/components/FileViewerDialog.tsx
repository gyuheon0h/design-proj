import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, CircularProgress, Box } from '@mui/material';

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
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Reset loading state when the dialog opens
  useEffect(() => {
    if (open) {
      setLoading(true);
    }
  }, [open, src]);

  const isImage = fileType.startsWith('image/');
  const isVideo = fileType.startsWith('video/');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md">
      <DialogContent sx={{ textAlign: 'center', position: 'relative' }}>
        {/* Show a loading spinner while the file is being fetched */}
        {loading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '20vh',
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {/* Image Viewer */}
        {isImage && (
          <img
            src={src}
            alt="preview"
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              display: loading ? 'none' : 'block',
            }}
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
        )}

        {/* Video Viewer with fix for hanging issue */}
        {isVideo && (
          <video
            key={src}
            ref={videoRef}
            controls
            autoPlay
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              display: loading ? 'none' : 'block',
            }}
            onLoadedData={() => setLoading(false)}
          >
            <source src={src} type={fileType} />
            Your browser does not support the video tag.
          </video>
        )}

        {/* If the file type is unsupported */}
        {!isImage && !isVideo && !loading && <p>Unsupported file type</p>}
      </DialogContent>
    </Dialog>
  );
};

export default FileViewerDialog;
