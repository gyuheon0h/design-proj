import { Router } from 'express';
import { authorize } from '../../middleware/authorize';
import FolderModel from '../../db_models/FolderModel';
import { AuthenticatedRequest } from '../../middleware/authorize';

const folderRouter = Router();

/**
 * GET /api/folders/parent/:folderId
 * Protected route to get subfolders of a specific folder.
 */
folderRouter.post(
  '/parent',
  authorize,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { folderId } = req.body; // Get from request body
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const userId = req.user.userId;

      // Handle null case properly
      const subfolders = await FolderModel.getSubfolders(
        userId,
        folderId || null,
      );

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
        isFavorited: false,
      });

      return res.status(201).json(newFolder);
    } catch (error) {
      console.error('Error creating folder:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

/**
 * GET /api/folder/foldername/:folderId
 * Get the name of a folder by id
 */
folderRouter.get('/foldername/:folderId', async (req, res) => {
  try {
    const { folderId } = req.params;
    const folderName = await FolderModel.getFolderName(folderId);
    return res.json(folderName);
  } catch (error) {
    console.error('Error getting folder name:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/files/favorites/:ownerId
 * Route to get favorited files owned by a certain user (ownerId).
 * This is protected by authorize
 */

folderRouter.get('/favorites/:ownerId', authorize, async (req, res) => {
  try {
    const { ownerId } = req.params;

    // ******** CHECK THIS OUT If we only want to let users get their own files
    if ((req as any).user.userId !== ownerId) {
      return res.status(403).json({
        message: 'Forbidden: You can only access your own favorited files.',
      });
    }

    const favoritedFiles = await FolderModel.getAllByOwnerAndColumn(
      ownerId,
      'isFavorited',
      true,
    );
    return res.json(favoritedFiles);
  } catch (error) {
    console.error('Error getting files by owner:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * PATCH /api/files/favorite/:fileId
 * Route to favorite a file
 */
folderRouter.patch('/favorite/:folderId', authorize, async (req, res) => {
  //TODO: make sure front end handles the that only owner can favorite a file
  try {
    const userId = (req as any).user.userId;
    const { folderId } = req.params;
    const folder = await FolderModel.getById(folderId);

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    if (userId != folder.owner) {
      return res.status(403).json({
        message: 'Unauthorized: User cannot favorite folders they do not own',
      });
    }

    const folderMetadata = await FolderModel.updateFolderMetadata(folderId, {
      isFavorited: !folder.isFavorited,
    });

    return res.status(200).json({
      message: 'Folder favorited successfully',
      folder: folderMetadata,
    });
  } catch (error) {
    console.error('Folder favorite error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

folderRouter.delete('/delete/:folderId', authorize, async (req, res) => {
  try {
    const { folderId } = req.params;
    const folder = await FolderModel.getById(folderId);

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    await FolderModel.softDelete(folderId);
    return res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default folderRouter;
