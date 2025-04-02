import { useCreateBlockNote, BlockNoteViewRaw } from '@blocknote/react';
import '@blocknote/core/style.css';
import { BlockNoteView } from '@blocknote/mantine';

const OwlEditor = () => {
  const editor = useCreateBlockNote();

  return <BlockNoteViewRaw editor={editor} />;
};

export default OwlEditor;
