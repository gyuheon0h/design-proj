import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Box,
  TextField,
} from '@mui/material';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

import axios from 'axios';
import OwlNoteViewer from './OwlNoteViewer';
import { Block } from '@blocknote/core';

interface OwlNoteEditorDialogProps {
  open: boolean;
  onClose: () => void;
  onOwlNoteCreate?: (
    fileName: string,
    content: string,
    parentFolder: string | null,
  ) => Promise<void>;
  onOwlNoteSave?: (fileName: string, content: string) => Promise<void>;
  fileId?: string;
  gcsKey?: string;
  fileType?: string;
  parentFolder: string | null;
  fileName: string | null;
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
  onOwlNoteSave,
  fileId,
  gcsKey,
  fileType,
  parentFolder,
  fileName,
}) => {
  const [initialContent, setInitialContent] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [editorRef, setEditorRef] = useState<any>(null);
  // State for file name dialog
  const [isFileNameDialogOpen, setIsFileNameDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [contentToSave, setContentToSave] = useState<string | null>(null);

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

  const effectiveContent =
    initialContent.length > 0 ? initialContent : defaultContent;

  // this function handles the save action for both create and update.
  const handleSave = async () => {
    if (!editorRef) return;
    const json = JSON.stringify(await editorRef.document);

    if (fileId && onOwlNoteSave) {
      onOwlNoteSave(fileId, json);
      onClose();
    } else if (onOwlNoteCreate) {
      setContentToSave(json);
      setIsFileNameDialogOpen(true);
    }
  };

  // called when the user confirms the file name in the new dialog.
  const handleConfirmFileName = async () => {
    if (onOwlNoteCreate && contentToSave) {
      try {
        await onOwlNoteCreate(newFileName.trim(), contentToSave, parentFolder);
      } catch (error) {
        console.error('Error creating new OwlNote file', error);
      }
    }
    setIsFileNameDialogOpen(false);
    onClose();
  };

  // determine whether the new file name is valid (non-empty after trimming)
  const isFileNameValid = newFileName.trim().length > 0;

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>
          {initialContent.length > 0
            ? 'Edit OwlNote File'
            : 'Create OwlNote File'}
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
            <OwlNoteViewer
              key={JSON.stringify(effectiveContent)}
              content={effectiveContent}
              editable={true}
              onEditorCreated={setEditorRef}
              fileName={fileName || newFileName}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* additional dialog prompting for file name if creating a new OwlNote file */}
      {isFileNameDialogOpen && (
        <Dialog
          open={isFileNameDialogOpen}
          onClose={() => setIsFileNameDialogOpen(false)}
        >
          <DialogTitle>Enter a File Name</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="File Name"
              type="text"
              fullWidth
              variant="standard"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              error={!isFileNameValid}
              helperText={!isFileNameValid ? 'File name is required.' : ''}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsFileNameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmFileName} disabled={!isFileNameValid}>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default OwlNoteEditorDialog;
