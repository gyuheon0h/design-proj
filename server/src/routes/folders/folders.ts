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

/**
 * POST /api/folders/create
 * Protected route to create a new folder.
 * TODO: make this authorized
 */
folderRouter.post('/create', async (req, res) => {
  try {
    const {
      name,
      owner,
      parentFolder,
      folderChildren: reqFolderChildren,
      fileChildren: reqFileChildren,
    } = req.body;

    const folderChildren = reqFolderChildren || [];
    const fileChildren = reqFileChildren || [];

    // Validate required fields
    if (!name || !owner) {
      return res.status(400).json({ error: 'Name and owner are required' });
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
});

export default folderRouter;
