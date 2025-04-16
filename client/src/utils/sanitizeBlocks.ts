import { Block } from '@blocknote/core';
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
