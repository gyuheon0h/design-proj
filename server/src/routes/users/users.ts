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
 * GET /api/:userId/favorites/folder
 * Route to get favorited folders (including shared).
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

      const permissions = await PermissionModel.getFoldersByUserId(userId);
      const favoritedFolders = await Promise.all(
        permissions.filter(perm => perm.isFavorited === true)
        .map((perm) => FolderModel.getById(perm.fileId)),
      );

      return res.json(favoritedFolders);
    } catch (error) {
      console.error('Error getting folders favorited by user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

/**
 * GET /api/user/permissions/:fileId
 * Route to get the permission for the user for the individual folder or file
 * (mainly used to access the isFavorited status).
 * 
 * Note: you don't need :userId because it's implicitly passed in through the session token,
 * unless we want it to be consistent with the other routes.
 */

userRouter.get(
  "/permissions/:fileId",
  authorize, 
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({error: "Unauthorized"});
      }

      const userId = req.user.userId;
      const { fileId } = req.params;

      const permission = await PermissionModel.getPermissionByFileAndUser(fileId, userId);
      return res.json(permission);
    } catch (error) {
      console.error("Error getting permission by user and file: ", error);
      return res.status(500).json({error: "Internal Service Error"});
    }
  },
);


/**
 * GET /api/:userId/favorites/file
 * Route to get [userId]'s favorite files (including shared files).
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
      
      const permissions = await PermissionModel.getFilesByUserId(userId); // TODO: does this include files that you own? how does shared pages work then? does it filter those out?
      const favoritedFiles = await Promise.all(
        permissions.filter(perm => perm.isFavorited === true)
        .map((perm) => FileModel.getById(perm.fileId)),
      );

      return res.json(favoritedFiles);
    } catch (error) {
      console.error('Error getting files favorited by user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

/**
 * PATCH /api/userId/favorites/:fileId
 */
userRouter.patch(
  '/:userId/favorites/:fileId',
  authorize,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const userId = req.user.userId;
      
      const permissions = await PermissionModel.getFilesByUserId(userId); // TODO: does this include files that you own? how does shared pages work then? does it filter those out?
      const favoritedFiles = await Promise.all(
        permissions.filter(perm => perm.isFavorited === true)
        .map((perm) => FileModel.getById(perm.fileId)),
      );

      return res.json(favoritedFiles);
    } catch (error) {
      console.error('Error getting files favorited by user:', error);
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
