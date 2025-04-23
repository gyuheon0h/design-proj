// OwlNoteViewer.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import { Block } from '@blocknote/core';
import { Node, ResolvedPos } from 'prosemirror-model';
import { TextSelection } from 'prosemirror-state';
import { getYjsProviderForRoom } from '@liveblocks/yjs';
import { useRoom } from '@liveblocks/react';
import { useUser } from '../context/UserContext';
import { cloneBlocksWithNewIds } from '../utils/blockUtils';
import {
  PDFExporter,
  pdfDefaultSchemaMappings,
} from '@blocknote/xl-pdf-exporter';
import * as ReactPDF from '@react-pdf/renderer';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

// Monkey-patch ProseMirror to clamp any out-of-range positions
(function () {
  // Patch Node.prototype.resolve to clamp pos
  const origNodeResolve = Node.prototype.resolve;
  Node.prototype.resolve = function (pos: number, ...args: any[]) {
    const max = (this as any).content.size;
    return origNodeResolve.call(this, Math.min(pos, max), ...args);
  };

  // Patch ResolvedPos.resolveCached similarly (some calls may go through this)
  const origResolveCached = ResolvedPos.resolveCached;
  if (origResolveCached) {
    ResolvedPos.resolveCached = function (
      doc: any,
      pos: number,
      ...args: any[]
    ) {
      const max = doc.content.size;
      return origResolveCached.call(this, doc, Math.min(pos, max), ...args);
    };
  }

  // Patch TextSelection.create to clamp too
  const origCreate = TextSelection.create;
  TextSelection.create = function (doc: any, pos: number, ...rest: any[]) {
    const max = doc.content.size;
    return origCreate.call(this, doc, Math.min(pos, max), ...rest);
  };
})();

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

  const editor = useCreateBlockNote({
    collaboration: {
      provider,
      fragment: yDoc.getXmlFragment('default'),
      user: { name: userId, color: '#ff5733' },
    },
  });

  const hasPopulated = useRef(false);

  useEffect(() => {
    if (
      editor &&
      content &&
      !hasPopulated.current &&
      editor.document.length === 1 &&
      editor.document[0]?.type === 'paragraph' &&
      editor.document[0]?.content.length === 0
    ) {
      try {
        const cloned = cloneBlocksWithNewIds(content);
        const point = editor.document.find((b) => b.type === 'paragraph');
        if (point) editor.insertBlocks(cloned, point, 'after');
        hasPopulated.current = true;
      } catch (e) {
        console.error('InsertBlock error:', e);
      }
    }
  }, [editor, content]);

  useEffect(() => {
    if (onEditorCreated) onEditorCreated(editor);
  }, [editor, onEditorCreated]);

  const handleExportPdf = async () => {
    try {
      if (!editor) {
        console.error('Editor not initialized');
        return;
      }
      const exporter = new PDFExporter(
        editor.schema as any,
        pdfDefaultSchemaMappings as any,
      );
      const doc = await exporter.toReactPDFDocument(editor.document as any);
      const asPdf = ReactPDF.pdf(doc);
      const blob = await asPdf.toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export error:', err);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
        <BlockNoteView editor={editor} editable={editable} />
      </Box>

      <Stack
        direction="row"
        spacing={2}
        justifyContent="flex-start"
        sx={{ padding: '8px 0' }}
      >
        <Button
          variant="outlined"
          onClick={handleExportPdf}
          startIcon={<PictureAsPdfIcon />}
          sx={{
            borderRadius: '8px',
            color: '#4286f5',
            borderColor: '#4286f5',
            '&:hover': {
              backgroundColor: 'rgba(66, 134, 245, 0.04)',
              borderColor: '#3a76d8',
            },
            textTransform: 'none',
            fontWeight: 500,
          }}
        >
          Export PDF
        </Button>
      </Stack>
    </Box>
  );
};

export default OwlNoteViewer;
