import React from 'react';
import { Box } from '@mui/material';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import { Block } from '@blocknote/core';

interface BlockNoteViewerProps {
  content: Block[];
}

const BlockNoteViewer: React.FC<BlockNoteViewerProps> = ({ content }) => {
  const editor = useCreateBlockNote({
    initialContent: content,
  });

  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
      <BlockNoteView editor={editor} editable={false} />
    </Box>
  );
};

export default BlockNoteViewer;
