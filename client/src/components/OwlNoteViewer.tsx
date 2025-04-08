// BlockNoteViewer.tsx
import React, { useEffect } from 'react';
import { Box, Button } from '@mui/material';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import { Block } from '@blocknote/core';
import {
  PDFExporter,
  pdfDefaultSchemaMappings,
} from '@blocknote/xl-pdf-exporter';
import * as ReactPDF from '@react-pdf/renderer';

// // Create the exporter
// const exporter = new PDFExporter(editor.schema, pdfDefaultSchemaMappings);

// // Convert the blocks to a react-pdf document
// const pdfDocument = await exporter.toReactPDFDocument(editor.document);

// // Use react-pdf to write to file:
// await ReactPDF.render(pdfDocument, `filename.pdf`);

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
      link.download = 'exported_document.pdf';
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
