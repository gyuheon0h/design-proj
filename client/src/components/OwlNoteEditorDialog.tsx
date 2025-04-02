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
        <Button onClick={onClose}>Close</Button>
        {/* Add save functionality if needed */}
      </DialogActions>
    </Dialog>
  );
};

export default OwlNoteEditorDialog;
