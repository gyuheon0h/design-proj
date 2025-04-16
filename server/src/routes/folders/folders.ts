import { Router } from 'express';
import { authorizeUser } from '../../middleware/authorizeUser';
import FolderModel from '../../db_models/FolderModel';
import { AuthenticatedRequest } from '../../middleware/authorizeUser';
import PermissionModel from '../../db_models/PermissionModel';
import { isUniqueFoldername } from '../folders/folderHelpers';
import { checkPermission } from '../../middleware/checkPermission';
import { bubbleUpResource } from '../helper';
import { recursiveDeletePermissions } from '../../db_models/ModelHelpers';

const folderRouter = Router();

/**
 * This is a route that works with recursively getting what folders are within another.
 */
folderRouter.get(
  '/parent/:folderId',
  authorizeUser,
  checkPermission('view'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { folderId } = req.params; // Get from request body
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const userId = req.user.userId;

      // Handle null case properly
      console.log('Folder router: ' + folderId);
      const subfolders = await FolderModel.getSubfolders(
        folderId,
        // folderId || null,
      );

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
 * POST /api/folders/create
 * Protected route to create a new folder.
 */
folderRouter.post(
  '/create',
  authorizeUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { name, parentFolder } = req.body;

      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const owner = req.user?.userId;
      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      // Check for duplicate file name in the folder
      const isUnique = await isUniqueFoldername(owner, name, parentFolder);
      if (!isUnique) {
        return res.status(400).json({ message: 'File name already exists in the directory' });
      }

      const newFolder = await FolderModel.createFolder({
        name,
        owner,
        createdAt: new Date(),
        parentFolder: parentFolder || null,
        deletedAt: null,
      });

      await PermissionModel.createPermission({
        fileId: newFolder.id,
        userId: owner,
        role: 'owner',
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

folderRouter.get('/:resourceId', authorizeUser, async (req, res) => {
  try {
    const { resourceId } = req.params;

    const userId = (req as any).user.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const folder = await FolderModel.getById(resourceId);

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    return res.json(folder);
  } catch (error) {
    console.error('Error getting bubbled folder:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

folderRouter.get(
  '/bubbleUpPerms/:resourceId',
  authorizeUser,
  async (req, res) => {
    try {
      const { resourceId } = req.params;

      const userId = (req as any).user.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const bubbledPermission = await bubbleUpResource(resourceId, userId);

      if (!bubbledPermission) {
        return res.status(404).json({ message: 'Bubbled perms not found' });
      }

      return res.json(bubbledPermission);
    } catch (error) {
      console.error('Error getting bubbled folder:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

/**
 * PATCH /api/folder/:folderId/favorite
 * Route to favorite/unfavorite a folder
 */
folderRouter.patch(
  '/:folderId/favorite',
  authorizeUser,
  checkPermission('favorite'),
  async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const { folderId } = req.params;

      // TODO: im thinking this is because we don't create a permission for yourself

      const permission = await PermissionModel.getPermissionByFileAndUser(
        folderId,
        userId,
      );

      if (!permission) {
        return res.status(404).json({ message: 'Folder not found' });
      }

      const permissionMetadata = await PermissionModel.updatePermission(
        permission.id,
        {
          isFavorited: !permission.isFavorited,
        },
      );

      return res.status(200).json({
        message: 'Folder favorited successfully',
        folder: permissionMetadata,
      });
    } catch (error) {
      console.error('Folder favorite error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

// // Bypassing auth for now. Will need to add back in later by checking permissions table
// folderRouter.post('/parent/shared', async (req, res) => {
//   try {
//     const { folderId } = req.body; // Get from request body
//     const subfolders = await FolderModel.getSubfolders(folderId || null);

//     // sort in descending order
//     const sortedSubfolders = subfolders.sort((a, b) => {
//       return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
//     });

//     return res.json(sortedSubfolders);
//   } catch (error) {
//     console.error('Error getting subfolders:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

/**
 * GETS all permissions pertaining to the fileId
 */
folderRouter.get(
  '/:folderId/permissions',
  authorizeUser,
  checkPermission('share'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const currentUserId = (req as any).user.userId;
      if (!currentUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { folderId } = req.params;
      const fileId = folderId;
      const sharedWith = await PermissionModel.getPermissionsByFileId(fileId);
      return res.json(sharedWith);
    } catch (error) {
      console.error('Error getting permissions:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

/**
 * PUT /api/folders/:folderId/permissions/:userId
 * Updates or creates a permission (cannot change to 'owner' if not already owner)
 */
folderRouter.put(
  '/:folderId/permissions/:userId',
  authorizeUser,
  checkPermission('share'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const currentUserId = (req as any).user.userId;
      if (!currentUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { folderId, userId } = req.params;
      const { role } = req.body;
      const fileId = folderId;
      // fetch folder
      const folder = await FolderModel.getById(folderId);
      if (!folder) return res.status(404).json({ error: 'File not found.' });

      // check owner
      if (role === 'owner' || userId == folder.owner) {
        return res.status(403).json({ error: 'Not allowed (sharing error).' });
      }

      // try to find existing permission
      const existingPerm = await PermissionModel.getPermissionByFileAndUser(
        fileId,
        userId,
      );

      if (existingPerm) {
        // update
        console.log('singular update permiswsion');
        if (folder.id !== undefined && folder.owner !== undefined) {
          await recursiveDeletePermissions(folder.id, folder.owner);
        }
        const updated = await PermissionModel.updatePermission(
          existingPerm.id,
          {
            role,
          },
        );

        return updated
          ? res.json(updated)
          : res.status(500).json({ error: 'Could not update permission.' });
      } else {
        console.log('singular create permiswsion');
        // create
        if (folder.id !== undefined && folder.owner !== undefined) {
          await recursiveDeletePermissions(folder.id, folder.owner);
        }
        const created = await PermissionModel.createPermission({
          fileId,
          userId,
          role,
        });
        return res.status(201).json(created);
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

/**
 * DELETE /api/folder/:folderId/permissions/:userId
 * Removes the permission for a particular user on a file (i.e., unshare).
 */
folderRouter.delete(
  '/:folderId/permissions/:userId',
  authorizeUser,
  checkPermission('share'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const currentUserId = req.user?.userId;
      if (!currentUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { folderId, userId } = req.params;
      const fileId = folderId;

      // fetch file
      const folder = await FolderModel.getById(folderId);
      if (!folder) {
        return res.status(404).json({ error: 'File not found' });
      }

      // check owner
      if (userId == folder.owner) {
        return res
          .status(403)
          .json({ error: 'You do not have permission to modify this file.' });
      }

      // try to find existing permission with (fileId, userId)
      const existingPerm = await PermissionModel.getPermissionByFileAndUser(
        fileId,
        userId,
      );

      if (!existingPerm) {
        return res.status(404).json({
          error: 'No permission entry found for this user/file pair.',
        });
      }

      // hard delete from permission
      await PermissionModel.hardDeletePermission(existingPerm.id);

      return res.sendStatus(204);
    } catch (error) {
      console.error('Error removing permission:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

folderRouter.delete(
  '/:folderId/delete',
  authorizeUser,
  checkPermission('delete'),
  async (req, res) => {
    try {
      const { folderId } = req.params;
      const folder = await FolderModel.getById(folderId);

      if (!folder) {
        return res.status(404).json({ message: 'Folder not found' });
      }
      await FolderModel.deleteFolder(folderId);
      return res.json({ message: 'Folder deleted successfully' });
    } catch (error) {
      console.error('Error deleting folder:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

folderRouter.patch(
  '/:folderId/restore',
  authorizeUser,
  checkPermission('restore'), //PRETTY SURE WE DONT NEED THE MIDDLEWARE CHECK
  async (req, res) => {
    try {
      const { folderId } = req.params;
      const folder = await FolderModel.getByIdAll(folderId);
      const userId = (req as any).user.userId;

      if (!folder) {
        return res.status(404).json({ message: 'Folder not found' });
      }

      const isUnique = await isUniqueFoldername(userId, folderId, folder.parentFolder);
      if (!isUnique) {
        return res.status(400).json({ message: 'File name already exists in the directory' });
      }

      await FolderModel.restore(folderId);
      return res.json({ message: 'Folder restored successfully' });
    } catch (error) {
      console.error('Error restoring folder:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

folderRouter.patch(
  '/:folderId/rename',
  authorizeUser,
  checkPermission('rename'),
  async (req, res) => {
    try {
      const { folderId } = req.params;
      const { resourceName } = req.body;

      if (!resourceName) {
        return res.status(400).json({ message: 'No new folder name provided' });
      }

      const userId = (req as any).user.userId;
      const folder = await FolderModel.getById(folderId);

      if (!folder) {
        return res.status(404).json({ message: 'Folder not found' });
      }

      // if (userId !== folder.owner) {
      //   return res.status(403).json({ message: 'Unauthorized' });
      // }

    // Check if the new name is unique in the same directory
    const isUnique = await isUniqueFoldername(userId, resourceName, folder.parentFolder);
    if (!isUnique) {
      return res.status(400).json({ message: 'File name already exists in the directory' });
    }

      const updatedFolder = await FolderModel.updateFolderMetadata(folderId, {
        name: resourceName,
      });

      return res.status(200).json({
        message: 'Folder renamed successfully',
        folder: updatedFolder,
      });
    } catch (error) {
      console.error('Folder rename error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

/**
 * PATCH /api/files/:folderId/move
 * Route to move a folder (updates parentFolderId)
 */
folderRouter.patch(
  '/:folderId/move',
  authorizeUser,
  checkPermission('move'),
  async (req, res) => {
    try {
      const { parentFolderId } = req.body;
      console.log(parentFolderId);
      // if (!parentFolderId) {
      //   return res
      //     .status(400)
      //     .json({ message: 'No new parentFolderId provided' });
      // }

      const userId = (req as any).user.userId;
      const { folderId } = req.params;
      const folder = await FolderModel.getById(folderId);

      if (folder?.parentFolder === parentFolderId) {
        console.error('User attempted to move to existing location');
        return res
          .status(400)
          .json({ message: 'No new parentFolderId provided' });
      }

      if (!folder) {
        return res.status(404).json({ message: 'Folder not found' });
      }

      const isUnique = await isUniqueFoldername(userId, folderId, parentFolderId);
      if (!isUnique) {
        return res.status(400).json({ message: 'File name already exists in the directory' });
      }

      const fileMetadata = await FolderModel.updateFolderMetadata(folderId, {
        parentFolder: parentFolderId,
      });

      return res.status(200).json({
        message: 'Folder moved successfully',
        file: fileMetadata,
      });
    } catch (error) {
      console.error('Folder move error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

export default folderRouter;
