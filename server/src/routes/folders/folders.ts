import { Router } from 'express';
import { authorize } from '../../middleware/authorize';
import FolderModel from '../../db_models/FolderModel';

const folderRouter = Router();

/**
 * GET /api/folders/parent/:folderId
 * Protected route to get subfolders of a specific folder.
 */
folderRouter.get('/parent/:folderId', authorize, async (req, res) => {
  try {
    const { folderId } = req.params;
    const subfolders = await FolderModel.getSubfolders(folderId);
    return res.json(subfolders);
  } catch (error) {
    console.error('Error getting subfolders:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default folderRouter;
