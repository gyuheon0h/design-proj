import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, CircularProgress, Box } from '@mui/material';
import {
  isSupportedFileTypeText,
  isSupportedFileTypeVideo,
} from '../utils/clientHelpers';

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  const isImage = fileType.startsWith('image/');
  const isVideo = isSupportedFileTypeVideo(fileType);
  const isPDF = fileType === 'application/pdf';
  const isText = isSupportedFileTypeText(fileType);
  const isAudio = fileType.startsWith('audio/');

  useEffect(() => {
    if (open) {
      setLoading(true);
      setTextContent(null);

      if (isSupportedFileTypeText(fileType) && !isPDF) {
        fetch(src)
          .then((response) => response.text())
          .then((text) => {
            setTextContent(text);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      }
    }
  }, [open, src, fileType, isPDF]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          height: '80vh',
        }}
      >
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

        {isImage && (
          <img
            src={src}
            alt="preview"
            style={{
              maxWidth: '80vh',
              maxHeight: '100vh',
              width: 'auto',
              height: 'auto',
              margin: 'auto',
              display: loading ? 'none' : 'block',
            }}
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
        )}

        {isVideo && (
          <video
            key={src}
            ref={videoRef}
            controls
            autoPlay
            style={{
              maxWidth: '80vh',
              maxHeight: '100vh',
              width: 'auto',
              height: 'auto',
              margin: 'auto',
              display: loading ? 'none' : 'block',
            }}
            onLoadedData={() => setLoading(false)}
          >
            <source src={src} type={fileType} />
            Your browser does not support the video tag.
          </video>
        )}

        {isPDF && (
          <iframe
            src={src}
            title="PDF Viewer"
            style={{
              width: '100vh',
              height: '80vh',
              display: loading ? 'none' : 'block',
            }}
            onLoad={() => setLoading(false)}
          />
        )}

        {isText && textContent && (
          <pre
            style={{
              width: '100%',
              height: '80vh',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              backgroundColor: '#f4f4f4',
              padding: '10px',
              borderRadius: '5px',
              textAlign: 'left',
              fontFamily: 'monospace',
            }}
          >
            {textContent}
          </pre>
        )}

        {isAudio && (
          <audio
            key={src}
            ref={audioRef}
            controls
            autoPlay
            style={{
              width: '100%',
              display: loading ? 'none' : 'block',
            }}
            onLoadedData={() => setLoading(false)}
          >
            <source src={src} type={fileType} />
            Your browser does not support the audio tag.
          </audio>
        )}

        {!isImage && !isVideo && !isPDF && !isText && !isAudio && !loading && (
          <p>Unsupported file type</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FileViewerDialog;
