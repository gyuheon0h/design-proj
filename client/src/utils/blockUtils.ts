import { BlockNoteEditor } from '@blocknote/core';
import { Block } from '@blocknote/core';
import { clone } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

const VALID_BLOCK_TYPES = [
  'paragraph',
  'heading',
  'codeBlock',
  'bulletListItem',
  'numberedListItem',
  'checkListItem',
  'table',
  'file',
  'image',
  'video',
  'audio',
] as const;

export const cloneBlocksWithNewIds = (blocks: Block[]): Block[] => {
  const clone = (block: Block): Block => ({
    ...block,
    id: uuidv4(),
    children: Array.isArray(block.children)
      ? block.children.filter(Boolean).map(clone)
      : [],
  });

  return (blocks || []).filter(Boolean).map(clone);
};

type ValidBlockType = (typeof VALID_BLOCK_TYPES)[number];

export const sanitizeBlocks = (blocks: Block[]): Block[] => {
  const cleanText = (text: any): string =>
    typeof text === 'string' ? text : '';

  const sanitize = (block: any): Block => ({
    id: uuidv4(),
    type: VALID_BLOCK_TYPES.includes(block.type) ? block.type : 'paragraph',
    props: {
      textAlignment: block.props?.textAlignment || 'left',
      backgroundColor: block.props?.backgroundColor || 'default',
      textColor: block.props?.textColor || 'default',
    },
    content: Array.isArray(block.content)
      ? block.content.map((c: any) => ({
          type: 'text',
          text: cleanText(c.text),
          styles: c.styles || {},
        }))
      : [],
    children: Array.isArray(block.children)
      ? block.children.filter(Boolean).map(sanitize)
      : [],
  });

  return blocks.filter(Boolean).map(sanitize);
};

export const safeEditorReplaceBlocks = (
  editor: BlockNoteEditor,
  content: Block[],
): void => {
  if (!editor || !content) return;

  requestAnimationFrame(() => {
    try {
      const clonedContent = cloneBlocksWithNewIds(content);
      const sanitized = sanitizeBlocks(clonedContent);
      editor.insertBlocks(clonedContent, editor.document[0], 'after');

      if (
        editor.document.length === 1 &&
        editor.document[0].type === 'paragraph' &&
        editor.document[0].content.length === 0
      ) {
        editor.replaceBlocks([editor.document[0]], sanitized);
      } else {
        editor.replaceBlocks([], sanitized);
      }

      // ✅ Optional: set selection to beginning
      const firstBlock = editor.document[0];
      if (firstBlock) {
        editor.setSelection(firstBlock, firstBlock);
      }

      editor.focus(); // keep UX smooth
      console.log('✅ Safe block injection completed.');
    } catch (err) {
      console.error('🔥 Safe injection failed:', err);
    }
  });
};
