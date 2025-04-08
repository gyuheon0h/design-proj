import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Box,
} from '@mui/material';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

import axios from 'axios';
import BlockNoteViewer from './BlockNoteViewer';
import { Block } from '@blocknote/core';

interface OwlNoteEditorDialogProps {
  open: boolean;
  onClose: () => void;
  onOwlNoteCreate?: (
    fileName: string,
    content: string,
    parentFolder: string | null,
  ) => Promise<void>;
  fileId?: string;
  gcsKey?: string;
  fileType?: string;
  fileName: string;
  parentFolder: string | null;
}

const defaultContent: Block[] = [
  {
    id: 'default-block',
    type: 'paragraph',
    props: {
      textColor: 'default',
      backgroundColor: 'default',
      textAlignment: 'left',
    },
    content: [{ type: 'text', text: '', styles: {} }],
    children: [],
  },
];

const OwlNoteEditorDialog: React.FC<OwlNoteEditorDialogProps> = ({
  open,
  onClose,
  onOwlNoteCreate,
  fileId,
  gcsKey,
  fileType,
  fileName,
  parentFolder,
}) => {
  const [initialContent, setInitialContent] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [editorRef, setEditorRef] = useState<any>(null);

  useEffect(() => {
    if (open && fileId && gcsKey && fileType) {
      setLoading(true);
      axios
        .post(
          `${process.env.REACT_APP_API_BASE_URL}/api/file/${fileId}/view`,
          { gcsKey, fileType },
          { withCredentials: true },
        )
        .then((response) => {
          console.log('Fetched content: ', response.data);
          let parsedContent;
          try {
            parsedContent =
              typeof response.data === 'string'
                ? JSON.parse(response.data)
                : response.data;
            setInitialContent(parsedContent);
          } catch (error) {
            console.error('Error parsing owl text content', error);
          }
        })
        .catch((error) => {
          console.error('Error fetching owl text content', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, fileId, gcsKey, fileType]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {initialContent.length > 0
          ? 'Edit BlockNote File'
          : 'Create BlockNote File'}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px',
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <BlockNoteViewer
            key={JSON.stringify(
              initialContent.length > 0 ? initialContent : defaultContent,
            )}
            content={
              initialContent.length > 0 ? initialContent : defaultContent
            }
            editable={true}
            onEditorCreated={setEditorRef}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={async () => {
            if (!editorRef) return;
            const json = JSON.stringify(await editorRef.document);

            // saving owl note, lowkey could be designed better but i cba
            if (fileId && gcsKey && fileType) {
              try {
                await axios.put(
                  `${process.env.REACT_APP_API_BASE_URL}/api/file/save/owlnote/:fileId`,
                  { content: json },
                  { withCredentials: true },
                );
              } catch (error) {
                console.error('Error saving owl text content', error);
              }
            } else if (onOwlNoteCreate) {
              onOwlNoteCreate(fileName, json, parentFolder);
            }

            onClose();
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OwlNoteEditorDialog;
