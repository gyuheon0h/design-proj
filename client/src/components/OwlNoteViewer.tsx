// BlockNoteViewer.tsx
import React, { useEffect, useMemo } from 'react';
import { Box, Button } from '@mui/material';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import { Block } from '@blocknote/core';
import {
  PDFExporter,
  pdfDefaultSchemaMappings,
} from '@blocknote/xl-pdf-exporter';
import * as ReactPDF from '@react-pdf/renderer';
import { getYjsProviderForRoom } from '@liveblocks/yjs';
import { useRoom } from '@liveblocks/react';
import { useUser } from '../context/UserContext';
import { useRef } from 'react';
import { cloneBlocksWithNewIds } from '../utils/cloneBlocks';

interface OwlNoteViewerProp {
  content: Block[];
  editable?: boolean;
  onEditorCreated?: (editor: any) => void;
  fileName: string;
}

const OwlNoteViewer: React.FC<OwlNoteViewerProp> = ({
  content,
  editable = false,
  onEditorCreated,
  fileName,
}) => {
  const userContext = useUser();
  const userId = userContext.userId;

  const room = useRoom();

  const provider = useMemo(() => getYjsProviderForRoom(room), [room]);
  const yDoc = provider.getYDoc();

  // const editor = useCreateBlockNote({ initialContent: content });
  const editor = useCreateBlockNote({
    collaboration: {
      provider,
      fragment: yDoc.getXmlFragment('default'),
      user: {
        name: userId,
        color: '#ff5733', // any hex color you want for cursor
      },
    },
  });

  const hasPopulated = useRef(false);

  // useEffect(() => {
  //   if (
  //     editor &&
  //     content &&
  //     !hasPopulated.current &&
  //     editor.document.length === 1 &&
  //     editor.document[0].type === 'paragraph' &&
  //     editor.document[0].content.length === 0
  //   ) {
  //     try {
  //       console.log('Document is empty. Inserting cloned blocks...');
  //       const clonedContent = cloneBlocksWithNewIds(content);
  //       editor.insertBlocks(clonedContent, editor.document[0], 'after');
  //       hasPopulated.current = true;
  //     } catch (err) {
  //       console.error('Failed to insert blocks:', err);
  //     }
  //   }
  // }, [editor, content]);

  useEffect(() => {
    console.log('user from viewer: ', userId);
    if (
      editor &&
      content &&
      !hasPopulated.current &&
      editor.document.length === 1 &&
      editor.document[0]?.type === 'paragraph' &&
      editor.document[0]?.content.length === 0
    ) {
      try {
        const clonedContent = cloneBlocksWithNewIds(content);

        // Extra safety check: make sure insert target is still valid
        const targetBlock = editor.document[0];
        if (!targetBlock) {
          console.warn('Target block for insertion does not exist.');
          return;
        }
        // editor.insertBlocks(clonedContent, targetBlock, 'after');

        const insertPoint = editor.document.find((b) => b.type === 'paragraph');
        if (insertPoint) {
          editor.insertBlocks(clonedContent, insertPoint, 'after');
        } else {
          console.warn('No suitable block found for insertion');
        }

        hasPopulated.current = true;
      } catch (err) {
        console.error('Failed to insert blocks:', err);
      }
    }
  }, [editor, content]);

  useEffect(() => {
    if (onEditorCreated) {
      onEditorCreated(editor);
    }
  }, [editor, onEditorCreated]);

  const handleExportPdf = async () => {
    try {
      if (!editor) {
        console.error('Editor not yet initialized.');
        return;
      }

      // create an exporter using the editor's schema and default schema mappings
      const exporter = new PDFExporter(
        editor.schema as unknown as any, // couldnt figure out how to resolve versioning dependencies...
        pdfDefaultSchemaMappings as unknown as any,
      );

      // convert the current document (blocks) into a React PDF document
      const pdfDocument = await exporter.toReactPDFDocument(
        editor.document as unknown as any,
      );

      // generate a pdf instance with react-pdf
      const asPdf = ReactPDF.pdf(pdfDocument);

      // convert the PDF document to a Blob
      const blob = await asPdf.toBlob();

      // create an object URL for the blob
      const url = URL.createObjectURL(blob);

      // create an anchor element and simulate a click to download the PDF
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName + '.pdf';
      link.click();

      // clean up the URL object.
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF: ', error);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
      <BlockNoteView editor={editor} editable={editable} />
      <Button onClick={handleExportPdf}>EXPORT PDF</Button>
    </Box>
  );
};

export default OwlNoteViewer;
