import { Router } from 'express';
import { authorize } from '../../middleware/authorize';
import FolderModel from '../../db_models/FolderModel';
import { AuthenticatedRequest } from '../../middleware/authorize';

const folderRouter = Router();

/**
 * GET /api/folders/parent/:folderId
 * Protected route to get subfolders of a specific folder.
 */
folderRouter.get(
  '/parent/:folderId',
  authorize,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { folderId } = req.params;
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const userId = req.user.userId;

      let subfolders;
      if (folderId === 'null') {
        subfolders = await FolderModel.getSubfolders(userId, null);
      } else {
        subfolders = await FolderModel.getSubfolders(userId, folderId);
      }

      return res.json(subfolders);
    } catch (error) {
      console.error('Error getting subfolders:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

/**
 * POST /api/folders/create
 * Protected route to create a new folder.
 * TODO: make this authorized
 */
folderRouter.post(
  '/create',
  authorize,
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        name,
        parentFolder,
        folderChildren: reqFolderChildren,
        fileChildren: reqFileChildren,
      } = req.body;

      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const folderChildren = reqFolderChildren || [];
      const fileChildren = reqFileChildren || [];
      const owner = req.user?.userId;
      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const newFolder = await FolderModel.createFolder({
        name,
        owner,
        createdAt: new Date(),
        parentFolder: parentFolder || null,
        folderChildren: folderChildren,
        fileChildren: fileChildren,
      });

      return res.status(201).json(newFolder);
    } catch (error) {
      console.error('Error creating folder:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

export default folderRouter;
