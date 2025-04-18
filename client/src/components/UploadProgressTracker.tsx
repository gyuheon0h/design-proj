import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, LinearProgress, Typography, IconButton } from "@mui/material";
// import { typography } from '../Styles';
import CloseIcon from "@mui/icons-material/Close";
import { UploadStatus } from '../interfaces/UploadStatus';

interface UploadProgressTrackerProps {
  uploads: UploadStatus[];
  open: boolean;
  onClose: () => void;
  // onUpdate: Promise<void>;  
}

const UploadProgressTracker: React.FC<UploadProgressTrackerProps> = ({ uploads, open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Upload Progress
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {uploads.length === 0 ? (
          <Typography>No active uploads</Typography>
        ) : (
          uploads.map((upload) => (
            <div key={upload.id} style={{ marginBottom: 16 }}>
              <Typography variant="body2">{upload.fileName}</Typography>
              <LinearProgress variant="determinate" value={upload.progress} />
              {upload.status === "error" && <Typography color="error">Failed: {upload.error}</Typography>}
            </div>
          ))
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UploadProgressTracker;