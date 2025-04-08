// BlockNoteViewer.tsx
import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import { Block } from '@blocknote/core';

interface OwlNoteViewerProp {
  content: Block[];
  editable?: boolean;
  onEditorCreated?: (editor: any) => void;
}

const OwlNoteViewer: React.FC<OwlNoteViewerProp> = ({
  content,
  editable = false,
  onEditorCreated,
}) => {
  const editor = useCreateBlockNote({ initialContent: content });

  useEffect(() => {
    if (onEditorCreated) {
      onEditorCreated(editor);
    }
  }, [editor, onEditorCreated]);

  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
      <BlockNoteView editor={editor} editable={editable} />
    </Box>
  );
};

export default OwlNoteViewer;
