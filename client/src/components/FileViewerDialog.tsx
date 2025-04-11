import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, CircularProgress, Box } from '@mui/material';
import {
  isSupportedFileTypeText,
  isSupportedFileTypeVideo,
} from '../utils/fileTypeHelpers';
import TextPreview from './TextPreview';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { Block } from '@blocknote/core';
import OwlNoteViewer from './OwlNoteViewer';
import { RoomProvider, ClientSideSuspense } from '@liveblocks/react';

interface FileViewerDialogProps {
  open: boolean;
  onClose: () => void;
  src: string;
  fileType: string;
  fileName: string;
}

const FileViewerDialog: React.FC<FileViewerDialogProps> = ({
  open,
  onClose,
  src,
  fileType,
  fileName,
}) => {
  const [loading, setLoading] = useState(true);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [blocknoteContent, setBlocknoteContent] = useState<Block[] | null>(
    null,
  );

  const isImage = fileType.startsWith('image/');
  const isVideo = isSupportedFileTypeVideo(fileType);
  const isPDF = fileType === 'application/pdf';
  const isText = isSupportedFileTypeText(fileType);
  const isAudio = fileType.startsWith('audio/');
  const isOwlNote = fileType === 'text/owlnote';

  useEffect(() => {
    if (open && src && !src.startsWith('about:blank')) {
      setLoading(true);
      setTextContent(null);
      setBlocknoteContent(null);
      console.log('fileType', fileType);

      if (isOwlNote || (isSupportedFileTypeText(fileType) && !isPDF)) {
        fetch(src)
          .then((response) => {
            if (!response.ok) throw new Error('Invalid file source');
            return response.text();
          })
          .then((text) => {
            if (isOwlNote) {
              try {
                console.log('text: ', text);

                const parsed = JSON.parse(text);
                console.log('PARSED:', parsed);

                setBlocknoteContent(parsed);
                console.log(
                  'Final BlockNote content passed to viewer:',
                  parsed,
                ); // should be array of block objs
              } catch (err) {
                console.error('Invalid BlockNote format');
              }
            } else {
              setTextContent(text);
            }
            setLoading(false);
            // console.log('blocknote content 2', blocknoteContent);
          })
          .catch((error) => {
            console.error('Error fetching file:', error);
            setTextContent(null);
            setBlocknoteContent(null);
            setLoading(false);
          });
      }
    }
  }, [open, src, fileType, isPDF, isOwlNote]);

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
        {/* {isOwlNote && blocknoteContent && (
          <OwlNoteViewer content={blocknoteContent} fileName={fileName} />
        )} */}
        {isOwlNote && blocknoteContent && (
          <RoomProvider id={`viewer-${fileName}`} initialPresence={{}}>
            <ClientSideSuspense
              fallback={
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <CircularProgress />
                </Box>
              }
            >
              {() => (
                <OwlNoteViewer content={blocknoteContent} fileName={fileName} />
              )}
            </ClientSideSuspense>
          </RoomProvider>
        )}

        {isText && textContent && (
          <TextPreview content={textContent} fileType={fileType} />
        )}

        {isAudio && (
          <audio
            key={src}
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

        {!isImage &&
          !isVideo &&
          !isPDF &&
          !isText &&
          !isAudio &&
          !isOwlNote &&
          !loading && <p>Unsupported file type</p>}
      </DialogContent>
    </Dialog>
  );
};

export default FileViewerDialog;
