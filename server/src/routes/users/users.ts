import { Router } from 'express';
import UserModel from '../../db_models/UserModel';
import { AuthenticatedRequest, authorize } from '../../middleware/authorize';
import PermissionModel from '../../db_models/PermissionModel';
import FolderModel from '../../db_models/FolderModel';
import FileModel from '../../db_models/FileModel';

const userRouter = Router();

userRouter.get('/', async (req, res) => {
  try {
    const userId = req.query.id;
    const user = await UserModel.getById(userId as string);
    return res.status(201).json({ user });
  } catch (error) {
    console.error('Error getting user:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

userRouter.get('/all', async (req, res) => {
  try {
    const users = await UserModel.getAll();
    return res.status(201).json(users);
  } catch (error) {
    console.error('Error getting all users:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/files/folder/:folderId
 * Route to get files in a certain folder.
 * this is also protected by authorize
 */
userRouter.post(
  '/:userId/home/file',
  authorize,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const userId = req.user.userId;

      const files = await FileModel.getFilesByOwnerAndFolder(userId, null);

      const sortedFiles = files.sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      return res.json(sortedFiles);
    } catch (error) {
      console.error('Error getting files by folder:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

/**
 * GET /api/folders/parent/:folderId
 * Protected route to get subfolders of a specific folder.
 */
userRouter.post(
  '/:userId/home/folder',
  authorize,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const userId = req.user.userId;

      // Handle null case properly
      const subfolders = await FolderModel.getSubfoldersByOwner(userId, null);

      // sort in descending order
      const sortedSubfolders = subfolders.sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      return res.json(sortedSubfolders);
    } catch (error) {
      console.error('Error getting subfolders:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

/**
 * GETS all folder and permissions that userId has permissions for
 */
userRouter.get(
  '/:userId/shared/folder',
  authorize,
  async (req: AuthenticatedRequest, res) => {
    try {
      const currentUserId = (req as any).user.userId;
      if (!currentUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const permissions =
        await PermissionModel.getFoldersByUserId(currentUserId);

      const folders = await Promise.all(
        permissions.map((perm) => FolderModel.getById(perm.fileId)),
      );

      return res.json({ permissions, folders });
    } catch (error) {
      console.error('Error getting shared folders:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

/**
 * GETS all folder and permissions that userId has permissions for
 */
userRouter.get(
  '/:userId/shared/file',
  authorize,
  async (req: AuthenticatedRequest, res) => {
    try {
      const currentUserId = (req as any).user.userId;
      if (!currentUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const permissions = await PermissionModel.getFilesByUserId(currentUserId);

      const files = await Promise.all(
        permissions.map((perm) => FileModel.getById(perm.fileId)),
      );
      return res.json({ files, permissions });
    } catch (error) {
      console.error('Error getting shared files:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

/**
 * GET /api/files/favorites/:ownerId
 * Route to get favorited files owned by a certain user (ownerId).
 * This is protected by authorize
 */

userRouter.get(
  '/:userId/favorites/folder',
  authorize,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const userId = req.user.userId;

      const favoritedFolders = await FolderModel.getAllByOwnerAndColumn(
        userId,
        'isFavorited',
        true,
      );
      return res.json(favoritedFolders);
    } catch (error) {
      console.error('Error getting files by owner:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

/**
 * GET /api/files/favorites/
 * Route to get favorited files owned by a certain user (ownerId).
 * This is protected by authorize
 */

userRouter.get(
  '/:userId/favorites/file',
  authorize,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const userId = req.user.userId;

      const favoritedFiles = await FileModel.getAllByOwnerAndColumn(
        userId,
        'isFavorited',
        true,
      );
      return res.json(favoritedFiles);
    } catch (error) {
      console.error('Error getting files by owner:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

userRouter.get(
  '/:userId/trash/file',
  authorize,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = (req as any).user.userId;
      const deletdFiles = await FileModel.getAllByOwnerAndDeleted(userId);
      return res.json(deletdFiles);
    } catch (error) {
      console.error('Error getting deleted files:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

userRouter.get('/:userId/trash/folder', authorize, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const deletedFolders = await FolderModel.getAllByOwnerAndDeleted(userId);
    return res.json(deletedFolders);
  } catch (error) {
    console.error('Error getting deleted folders:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default userRouter;
