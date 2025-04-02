import React from 'react';
import { BlockNoteView, useCreateBlockNote } from '@blocknote/react';
import '@blocknote/core/style.css';

const OwlEditor = () => {
  const editor = useCreateBlockNote({
    // Optional: Initial content, onEditorContentChange callback, etc.
    onEditorContentChange: (editor) => {
      const json = editor.document; // BlockNote's internal representation
      console.log('Editor content changed:', json);
    },
  });

  return <BlockNoteView editor={editor} />;
};

export default OwlEditor;
