import { Router } from 'express';
import { AuthenticatedRequest, authorize } from '../../middleware/authorize';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import StorageService from '../../storage';
import FileModel from '../../db_models/FileModel';
import PermissionModel from '../../db_models/PermissionModel';
import { inferMimeType } from './fileHelpers';

const fileRouter = Router();
const upload = multer(); // Using memory storage to keep things minimal (TODO: implement streaming)

// fileRouter.get('/root', authorize, async (req: AuthenticatedRequest, res) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }

//     const userId = req.user.userId;
//     const files = await FileModel.getFilesByOwnerAndFolder(userId, null);
//     return res.json(files);
//   } catch (error) {
//     console.error('Error getting root folder files:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

/**
 * GET /api/files/owner/:ownerId
 * Route to get files owned by a certain user (ownerId).
 * This is protected by authorize
 */
// fileRouter.get('/owner/:ownerId', authorize, async (req, res) => {
//   try {
//     const { ownerId } = req.params;

//     // ******** CHECK THIS OUT If we only want to let users get their own files
//     // if ((req as any).user.userId !== ownerId) {
//     //   return res.status(403).json({ message: 'Forbidden: You can only access your own files.' });
//     // }

//     const files = await FileModel.getFilesByOwner(ownerId);
//     return res.json(files);
//   } catch (error) {
//     console.error('Error getting files by owner:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

/**
 * GET /api/files/folder/:folderId
 * Route to get files in a certain folder.
 * this is also protected by authorize
 */
fileRouter.post(
  '/folder',
  authorize,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { folderId } = req.body;
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const userId = req.user.userId;

      const files = await FileModel.getFilesByOwnerAndFolder(
        userId,
        folderId || null,
      );

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
 * GET /api/files/favorites/
 * Route to get favorited files owned by a certain user (ownerId).
 * This is protected by authorize
 */

fileRouter.get(
  '/favorites',
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

/**
 * POST /api/files/upload
 * Route to upload a file
 */
fileRouter.post(
  '/upload',
  authorize,
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      let { originalname, buffer, mimetype } = req.file;
      const { parentFolder = null, fileName } = req.body;
      const userId = (req as any).user.userId;
      // If the MIME type is 'application/octet-stream', try to infer it
      if (mimetype === 'application/octet-stream') {
        mimetype = inferMimeType(originalname);
      }

      // Generate a unique file ID and file pagth
      const fileId = uuidv4();
      const gcsFilePath = `uploads/${userId}/${parentFolder || 'root'}/${fileId}-${originalname}`;

      // Upload to GCS
      await StorageService.uploadFile(gcsFilePath, buffer, mimetype);

      // Save metadata to the database
      const fileMetadata = await FileModel.create({
        id: fileId,
        name: fileName,
        owner: userId,
        createdAt: new Date(),
        lastModifiedBy: null,
        lastModifiedAt: new Date(),
        parentFolder: parentFolder || null, // Allow null for root files
        gcsKey: gcsFilePath,
        fileType: mimetype,
        isFavorited: false,
      });

      return res
        .status(201)
        .json({ message: 'File uploaded successfully', file: fileMetadata });
    } catch (error) {
      console.error('File upload error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

fileRouter.get('/download/:fileId', authorize, async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await FileModel.getById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const fileStream = await StorageService.getFileStream(file.gcsKey);
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

fileRouter.delete('/delete/:fileId', authorize, async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await FileModel.getById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    // TODO: think about good way to soft/hard delete from gcsKey. Should we have async process to
    // hard delete files that have been soft deleted for a long time?
    // await StorageService.deleteFile(file.gcsKey);
    await FileModel.softDelete(fileId);
    return res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

fileRouter.delete('/delete/:fileId', authorize, async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await FileModel.getById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete file from GCS
    await StorageService.deleteFile(file.gcsKey);

    // Delete from database
    await FileModel.deleteFile(fileId);

    return res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * PATCH /api/files/favorite/:fileId
 * Route to favorite/unfavorite a file
 */

fileRouter.patch('/favorite/:fileId', authorize, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { fileId } = req.params;
    const file = await FileModel.getById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (userId != file.owner) {
      return res.status(403).json({
        message: 'Unauthorized: User cannot favorite files they do not own',
      });
    }

    const fileMetadata = await FileModel.updateFileMetadata(fileId, {
      isFavorited: !file.isFavorited,
    });

    return res.status(200).json({
      message: 'File favorited successfully',
      file: fileMetadata,
    });
  } catch (error) {
    console.error('File favorite error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * PATCH /api/files/rename/:fileId
 * Route to rename a file (also updates lastModifiedBy and lastModifiedAt)
 */
fileRouter.patch('/rename/:fileId', authorize, async (req, res) => {
  try {
    const { fileName } = req.body;
    if (!fileName) {
      return res.status(400).json({ message: 'No new file name provided' });
    }

    const userId = (req as any).user.userId;
    const { fileId } = req.params;
    const file = await FileModel.getById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const fileMetadata = await FileModel.updateFileMetadata(fileId, {
      name: fileName,
      lastModifiedBy: userId, //TODO: may need to get userName thru userId
      lastModifiedAt: new Date(),
    });

    return res.status(200).json({
      message: 'File renamed successfully',
      file: fileMetadata,
    });
  } catch (error) {
    console.error('File rename error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * PATCH /api/files/:fileId/move
 * Route to move a file (updates parentFolderId)
 */
fileRouter.patch(':fileId/move', authorize, async (req, res) => {
  try {
    const { parentFolderId } = req.body;
    // if (!parentFolderId) { // why is this commented out ? is it because it was copy pasted/irrelevant for this
    //   return res
    //     .status(400)
    //     .json({ message: 'No new parentFolderId provided' });
    // }
    // const userId = (req as any).user.userId;
    const { fileId } = req.params; // this is the weird dollar sign thing in the url
    const file = await FileModel.getById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file?.parentFolder === parentFolderId) {
      console.error('User attempted to move to existing location');
      return res
        .status(400)
        .json({ message: 'No new parentFolderId provided' });
    }

    const fileMetadata = await FileModel.updateFileMetadata(fileId, {
      parentFolder: parentFolderId,
    });

    return res.status(200).json({
      message: 'File moved successfully',
      file: fileMetadata,
    });
  } catch (error) {
    console.error('File move error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GETS all folder and permissions that userId has permissions for
 */
fileRouter.get('/shared', authorize, async (req: AuthenticatedRequest, res) => {
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
});

// Bypass auth for shared page. Need to add security here, maybe check permissions table
fileRouter.post('/folder/shared', async (req: AuthenticatedRequest, res) => {
  try {
    const { folderId } = req.body;

    const files = await FileModel.getFilesByFolder(folderId || null);

    const sortedFiles = files.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return res.json(sortedFiles);
  } catch (error) {
    console.error('Error getting files by folder:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GETS all permissions pertaining to the fileId
 */
fileRouter.get(
  '/:fileId/permissions',
  authorize,
  async (req: AuthenticatedRequest, res) => {
    try {
      const currentUserId = (req as any).user.userId;
      if (!currentUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { fileId } = req.params;
      const sharedWith = await PermissionModel.getPermissionsByFileId(fileId);
      return res.json(sharedWith);
    } catch (error) {
      console.error('Error getting permissions:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

/**
 * PUT /api/files/:fileId/permissions/:userId
 * Updates or creates a permission (cannot change to 'owner' if not already owner)
 */
fileRouter.put(
  '/:fileId/permissions/:userId',
  authorize,
  async (req: AuthenticatedRequest, res) => {
    try {
      const currentUserId = (req as any).user.userId;
      if (!currentUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { fileId, userId } = req.params;
      const { role } = req.body;

      // fetch file
      const file = await FileModel.getById(fileId);
      if (!file) return res.status(404).json({ error: 'File not found.' });

      // check owner
      if (file.owner !== currentUserId) {
        return res.status(403).json({ error: 'Not allowed.' });
      }

      // try to find existing permission
      const existingPerm = await PermissionModel.getPermissionByFileAndUser(
        fileId,
        userId,
      );

      if (existingPerm) {
        // update
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
        // create
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
 * DELETE /api/files/:fileId/permissions/:userId
 * Removes the permission for a particular user on a file
 */
fileRouter.delete(
  '/:fileId/permissions/:userId',
  authorize,
  async (req: AuthenticatedRequest, res) => {
    try {
      const currentUserId = req.user?.userId;
      if (!currentUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { fileId, userId } = req.params;

      // fetch file
      const file = await FileModel.getById(fileId);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // check owner
      if (file.owner !== currentUserId) {
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

fileRouter.get('/trash', authorize, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = (req as any).user.userId;
    const deletdFiles = await FileModel.getAllByOwnerAndDeleted(userId);
    return res.json(deletdFiles);
  } catch (error) {
    console.error('Error getting deleted files:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

fileRouter.patch('/restore/:fileId', authorize, async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await FileModel.getByIdAll(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    await FileModel.restore(fileId);
    return res.json({ message: 'File restored successfully' });
  } catch (error) {
    console.error('Error restoring file:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

fileRouter.post('/view', async (req, res) => {
  try {
    const { gcsKey, fileType } = req.body;

    if (!gcsKey || !fileType) {
      return res.status(400).json({
        error: 'Missing required query parameters: gcsKey, fileType',
      });
    }

    // stream from GCS
    const readStream = StorageService.getFileStream(String(gcsKey));

    // set Content-Type header
    res.setHeader('Content-Type', String(fileType));

    // send file
    readStream.pipe(res);
  } catch (error) {
    console.error('Error streaming file from GCS:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default fileRouter;
