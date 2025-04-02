import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import axios from 'axios';

interface OwlNoteEditorDialogProps {
  open: boolean;
  onClose: () => void;
}

const OwlNoteEditorDialog: React.FC<OwlNoteEditorDialogProps> = ({
  open,
  onClose,
}) => {
  const editor = useCreateBlockNote();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Create BlockNote File</DialogTitle>
      <DialogContent>
        <BlockNoteView editor={editor} />
      </DialogContent>
      <DialogActions>
        {/* SAVE FUNCTIONALITY */}
        <Button
          onClick={async () => {
            const json = JSON.stringify(await editor.document);
            await axios.put(
              `${process.env.REACT_APP_API_BASE_URL}/api/file/upload/owltext`,
              { content: json },
            );
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
