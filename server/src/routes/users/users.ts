import { Router } from 'express';
import UserModel from '../../db_models/UserModel';
import { AuthenticatedRequest, authorize } from '../../middleware/authorize';
import PermissionModel from '../../db_models/PermissionModel';
import FolderModel from '../../db_models/FolderModel';
import FileModel from '../../db_models/FileModel';
import StorageService from '../../storage';
import jwt from 'jsonwebtoken';

const userRouter = Router();

// userRouter.get('/', async (req, res) => {
//   try {
//     const userId = req.query.id;
//     const user = await UserModel.getById(userId as string);
//     return res.status(201).json({ user });
//   } catch (error) {
//     console.error('Error getting user:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

/**
 * I believe req isn't used and so I've underscored it
 */
userRouter.get('/all', async (_, res) => {
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
userRouter.get(
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
userRouter.get(
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
        permissions
          .filter((perm) => perm.isFavorited === true)
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

      const permissions = await PermissionModel.getFilesByUserId(userId); // TODO: does this include files that you own? how does shared pages work then? does it filter those out?
      const favoritedFiles = await Promise.all(
        permissions
          .filter((perm) => perm.isFavorited === true)
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
        permissions
          .filter((perm) => perm.isFavorited === true)
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

userRouter.post(
  '/:userId/update-profile',
  authorize,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { username, newPassword } = req.body;
      const userId = req.user.userId;

      const user = await UserModel.getById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (username && username !== user.username) {
        const existingUser = await UserModel.getUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ error: 'Username already taken' });
        }
      }

      const updateData: Partial<typeof user> = {};
      if (username) {
        updateData.username = username;
      }

      if (newPassword) {
        updateData.passwordHash = newPassword;
      }

      await UserModel.update(userId, updateData);

      if (username) {
        const token = jwt.sign(
          { userId, username },
          process.env.JWT_SECRET as string,
        );

        res.cookie('authToken', token, {
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000,
        });
      }

      return res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

userRouter.delete(
  '/:userId/delete-account',
  authorize,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userId = req.user.userId;

      const userFiles = await FileModel.getFilesByOwner(userId);
      await UserModel.hardDeleteOnCondition('id', userId);
      await PermissionModel.hardDeleteOnCondition('userId', userId);
      await FileModel.hardDeleteOnCondition('owner', userId);

      // Remove actual files from GCP Storage -> delete.
      for (const file of userFiles) {
        await StorageService.deleteFile(file.gcsKey);
      }

      // Clear session
      res.clearCookie('authToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
      });

      return res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Error deleting account:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

userRouter.get('/:userId/permissions/:fileId', async (req, res) => {
  try {
    const { userId, fileId } = req.params;

    if (!userId || !fileId) {
      return res.status(400).json({ error: 'Missing userId or fileId' });
    }

    // Check if the file is favorited by the user
    const permission = await PermissionModel.getPermissionByFileAndUser(
      fileId,
      userId,
    );

    if (!permission) {
      return res
        .status(404)
        .json({ error: 'No permission found for this file' });
    }

    return res.json({ isFavorited: permission.isFavorited || false });
  } catch (error) {
    console.error('Error checking if file is favorited:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default userRouter;
