// ImageViewerDialog.tsx
import React from 'react';
import { Dialog, DialogContent } from '@mui/material';

interface ImageViewerDialogProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
}

const ImageViewerDialog: React.FC<ImageViewerDialogProps> = ({
  open,
  onClose,
  imageSrc,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md">
      <DialogContent sx={{ textAlign: 'center' }}>
        <img
          src={imageSrc}
          alt="preview"
          style={{ maxWidth: '100%', maxHeight: '80vh' }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewerDialog;
