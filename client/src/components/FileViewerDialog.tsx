import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Lightbox from 'yet-another-react-lightbox';
import Video from 'yet-another-react-lightbox/plugins/video';
import 'yet-another-react-lightbox/styles.css';
import { Document, Page } from 'react-pdf';

interface FileViewerDialogProps {
  fileId: string;
  fileType: string;
  open: boolean;
  onClose: () => void;
}

const FileViewerDialog: React.FC<FileViewerDialogProps> = ({
  fileId,
  fileType,
  open,
  onClose,
}) => {
  const [fileUrl, setFileUrl] = useState<string>('');

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const url = `http://localhost:5001/api/file/${fileId}`;
        setFileUrl(url);
      } catch (error) {
        console.error('Error fetching file:', error);
      }
    };
    fetchFile();
  }, [fileId]);

  const renderContent = () => {
    if (fileType.startsWith('image/')) {
      return (
        <Lightbox
          open={open}
          close={onClose}
          slides={[{ src: fileUrl }]}
          render={{
            buttonPrev: () => null,
            buttonNext: () => null,
          }}
          carousel={{ finite: true }}
        />
      );
      // } else if (fileType.startsWith('video/')) {
      //   return (
      //     <Lightbox
      //       open={open}
      //       close={onClose}
      //       slides={[
      //         { type: 'video', sources: [{ src: fileUrl, type: fileType }] },
      //       ]}
      //       plugins={[Video]}
      //       render={{
      //         buttonPrev: () => null,
      //         buttonNext: () => null,
      //       }}
      //       carousel={{ finite: true }}
      //     />
      //   );
      // } else if (fileType.startsWith('audio/')) {
      //   return (
      //     <audio controls style={{ width: '100%' }}>
      //       <source src={fileUrl} type={fileType} />
      //       Your browser does not support the audio element.
      //     </audio>
      //   );
      // } else if (fileType.startsWith('text/')) {
      //   return (
      //     <iframe
      //       src={fileUrl}
      //       style={{ width: '100%', height: '80vh', border: 'none' }}
      //       title="Text File Viewer"
      //     />
      //   );
      // } else if (fileType === 'application/pdf') {
      //   return (
      //     <Document file={fileUrl}>
      //       <Page pageNumber={1} />
      //     </Document>
      //   );
    } else {
      return <p>Unsupported file type</p>;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogContent>{renderContent()}</DialogContent>
    </Dialog>
  );
};

export default FileViewerDialog;
