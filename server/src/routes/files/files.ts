import { Router } from 'express';
import { authorize } from '../../middleware/authorize';
import FileModel from '../../db_models/FileModel';

const fileRouter = Router();

/**
 * GET /api/files/owner/:ownerId
 * Route to get files owned by a certain user (ownerId).
 * This is protected by authorize
 */
fileRouter.get('/owner/:ownerId', authorize, async (req, res) => {
  try {
    const { ownerId } = req.params;

    // ******** CHECK THIS OUT If we only want to let users get their own files
    // if ((req as any).user.userId !== ownerId) {
    //   return res.status(403).json({ message: 'Forbidden: You can only access your own files.' });
    // }

    const files = await FileModel.getFilesByOwner(ownerId);
    return res.json(files);
  } catch (error) {
    console.error('Error getting files by owner:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/files/folder/:folderId
 * Route to get files in a certain folder.
 * this is also protected by authorize
 */
fileRouter.get('/folder/:folderId', authorize, async (req, res) => {
  try {
    const { folderId } = req.params;

    const files = await FileModel.getFilesByFolder(folderId);
    return res.json(files);
  } catch (error) {
    console.error('Error getting files by folder:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default fileRouter;
