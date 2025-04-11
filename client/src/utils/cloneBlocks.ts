import { Block } from '@blocknote/core';
import { v4 as uuidv4 } from 'uuid';

export const cloneBlocksWithNewIds = (blocks: Block[]): Block[] => {
  const clone = (block: Block): Block => ({
    ...block,
    id: uuidv4(),
    children: block.children?.map(clone) || [],
  });
  return blocks.map(clone);
};
