import { Router } from 'express';
import {
  AuthenticatedRequest,
  authorizeUser,
} from '../../middleware/authorizeUser';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import StorageService from '../../storage';
import FileModel from '../../db_models/FileModel';
import PermissionModel from '../../db_models/PermissionModel';
import { inferMimeType, isUniqueFileName } from './fileHelpers';
import { checkPermission } from '../../middleware/checkPermission';

const fileRouter = Router();
const upload = multer(); // Using memory storage to keep things minimal (TODO: implement streaming)

/**
 * POST /api/files/upload
 * Route to upload a file
 */
fileRouter.post(
  '/upload',
  authorizeUser,
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { fileName, parentFolder = null } = req.body;
      if (!fileName) {
        return res.status(400).json({ message: 'No file name provided' });
      }

      const userId = (req as any).user.userId;

      // Check for duplicate file name in the folder
      const isUnique = await isUniqueFileName(userId, fileName, parentFolder);
      if (!isUnique) {
        return res.status(400).json({ message: 'File name already exists in the directory' });
      }

      let { originalname, buffer, mimetype, size } = req.file;
      console.log('req.file.size bytes:', size);

      const userFiles = await FileModel.getFilesByOwner(userId);
      userFiles.forEach((file) => {
        console.log(`[STORAGE DEBUG] ${file.name}: ${file.fileSize} bytes`);
      });

      const totalStorageUsed = userFiles.reduce(
        (sum, file) => sum + Number(file.fileSize),
        0,
      );

      const STORAGE_LIMIT = 15 * 1024 * 1024 * 1024; // 15GB

      if (totalStorageUsed + size > STORAGE_LIMIT) {
        console.log('total used: ', totalStorageUsed);
        return res.status(400).json({ error: 'Storage limit exceeded. Cannot upload file.' });
      }

      if (mimetype === 'application/octet-stream') {
        mimetype = inferMimeType(originalname);
      }

      const fileId = uuidv4();
      const gcsFilePath = `uploads/${userId}/${parentFolder || 'root'}/${fileId}-${originalname}`;

      await StorageService.uploadFile(gcsFilePath, buffer, mimetype);

      const fileMetadata = await FileModel.create({
        id: fileId,
        name: fileName,
        owner: userId,
        createdAt: new Date(),
        lastModifiedBy: null,
        lastModifiedAt: new Date(),
        parentFolder: parentFolder || null,
        gcsKey: gcsFilePath,
        fileType: mimetype,
        fileSize: size,
      });

      await PermissionModel.createPermission({
        fileId: fileMetadata.id,
        userId,
        role: 'owner',
      });

      return res.status(201).json({
        message: 'File uploaded successfully',
        file: fileMetadata,
      });
    } catch (error) {
      console.error('File upload error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

fileRouter.get('/download/:fileId', authorizeUser, async (req, res) => {
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

//TODO protect the two new owlnote endpoints with perms
fileRouter.post('/create/owlnote', authorizeUser, async (req, res) => {
  try {
    const { fileName, content, parentFolder = null } = req.body;

    // Validate required fields
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    if (!fileName) {
      return res.status(400).json({ error: 'File name is required' });
    }

    const userId = (req as any).user.userId;
    const fileId = uuidv4();

    const isUnique = await isUniqueFileName(userId, fileName, parentFolder);
      if (!isUnique) {
        return res.status(400).json({ message: 'File name already exists in the directory' });
    }

    let finalFileName = fileName;
    if (!finalFileName.endsWith('.owlnote')) {
      finalFileName += '.owlnote';
    }

    const buffer = Buffer.from(content, 'utf-8');
    const mimeType = 'text/owlnote';

    const gcsFilePath = `uploads/${userId}/${parentFolder || 'root'}/${fileId}-${finalFileName}`;

    await StorageService.uploadFile(gcsFilePath, buffer, mimeType);

    const fileMetadata = await FileModel.create({
      id: fileId,
      name: finalFileName,
      owner: userId,
      createdAt: new Date(),
      lastModifiedBy: null,
      lastModifiedAt: new Date(),
      parentFolder: parentFolder || null, // allow null for root files
      gcsKey: gcsFilePath,
      fileType: mimeType, // this should be 'text/owlnote'
    });

    await PermissionModel.createPermission({
      fileId: fileMetadata.id,
      userId: userId,
      role: 'owner',
    });

    return res.status(201).json({
      message: 'OwlNote file saved successfully',
      file: fileMetadata,
    });
  } catch (error) {
    console.error('OwlNote file upload error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

//TODO protect the two new owlnote endpoints with perms
fileRouter.get(
  '/:fileId/download',
  authorizeUser,
  checkPermission('download'),
  async (req, res) => {
    try {
      const { fileId } = req.params;
      const file = await FileModel.getById(fileId);

      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      const fileStream = await StorageService.getFileStream(file.gcsKey);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${file.name}"`,
      );
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error downloading file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

fileRouter.get(
  '/:fileId/download',
  authorizeUser,
  checkPermission('download'),
  async (req, res) => {
    try {
      const { fileId } = req.params;
      const file = await FileModel.getById(fileId);

      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      const fileStream = await StorageService.getFileStream(file.gcsKey);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${file.name}"`,
      );
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error downloading file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);
fileRouter.delete(
  '/:fileId/delete',
  authorizeUser,
  checkPermission('delete'),
  async (req, res) => {
    try {
      const { fileId } = req.params;
      const file = await FileModel.getById(fileId);

      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      // // Delete file from GCS
      // await StorageService.deleteFile(file.gcsKey);
      // this is a little hazardous; this is a hard delete on the GCS;
      // and should not occur

      // Delete from database
      await FileModel.deleteFile(fileId);

      return res.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Error deleting file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

/**
 * PATCH /api/files/:fileId/favorite
 * Route to favorite/unfavorite a file
 */

fileRouter.patch(
  '/:fileId/favorite',
  authorizeUser,
  checkPermission('favorite'),
  async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const { fileId } = req.params;
      const permission = await PermissionModel.getPermissionByFileAndUser(
        fileId,
        userId,
      );

      if (!permission) {
        return res.status(404).json({ message: 'File not found' });
      }

      const permissionMetadata = await PermissionModel.updatePermission(
        permission.id,
        {
          isFavorited: !permission.isFavorited,
        },
      );

      return res.status(200).json({
        message: 'File favorited successfully',
        file: permissionMetadata,
      });
    } catch (error) {
      console.error('File favorite error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

/**
 * PATCH /api/files/:fileId/rename
 * Route to rename a file (also updates lastModifiedBy and lastModifiedAt)
 */
fileRouter.patch(
  '/:fileId/rename',
  authorizeUser,
  checkPermission('rename'),
  async (req, res) => {
    try {
      const { resourceName } = req.body;
      if (!resourceName) {
        return res.status(400).json({ message: 'No new file name provided' });
      }

      const userId = (req as any).user.userId;
      const { fileId } = req.params;
      const file = await FileModel.getById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if the new name is unique in the same directory
    const isUnique = await isUniqueFileName(userId, resourceName, file.parentFolder);
    if (!isUnique) {
      return res.status(400).json({ message: 'File name already exists in the directory' });
    }
    

    const fileMetadata = await FileModel.updateFileMetadata(fileId, {
      name: resourceName,
      lastModifiedBy: userId,
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
  },
);

/**
 * PATCH /api/files/:fileId/move
 * Route to move a file (updates parentFolderId)
 */
fileRouter.patch(
  '/:fileId/move',
  authorizeUser,
  checkPermission('move'),
  async (req, res) => {
    try {
      const { parentFolderId } = req.body;
      // if (!parentFolderId) {
      //   return res
      //     .status(400)
      //     .json({ message: 'No new parentFolderId provided' });
      // }

      const userId = (req as any).user.userId;
      const { fileId } = req.params;
      const file = await FileModel.getById(fileId);

      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      const isUnique = await isUniqueFileName(userId, fileId, parentFolderId);
      if (!isUnique) {
        return res.status(400).json({ message: 'File name already exists in the directory' });
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
  },
);

// Bypass auth for shared page. Need to add security here, maybe check permissions table
// Returns sorted files on a given parent folder. Therefore, we need to
fileRouter.get(
  '/parent/:folderId',
  authorizeUser,
  checkPermission('view'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { folderId } = req.params;
      // console.log('we are on shared page searching for folderId: ' + folderId);
      const files = await FileModel.getFilesByFolder(folderId); // ||null was originally here

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
 * GETS all permissions pertaining to the fileId
 */
fileRouter.get(
  '/:fileId/permissions',
  authorizeUser,
  checkPermission('share'),
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
  authorizeUser,
  checkPermission('share'),
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
      if (role === 'owner' || userId == file.owner) {
        return res.status(403).json({ error: 'Not allowed.' });
      }

      // try to find existing permission
      const existingPerm = await PermissionModel.getPermissionByFileAndUser(
        fileId,
        userId,
      );

      if (existingPerm) {
        console.log('updating perm ! ! ! ');
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
        console.log('creating perm ! ! ! ');
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
  authorizeUser,
  checkPermission('share'),
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
      if (userId == file.owner) {
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

fileRouter.patch(
  '/:fileId/restore',
  authorizeUser,
  checkPermission('restore'), //PRETTY SURE WE DONT NEED THIS MIDDLEWARE CHECK
  async (req, res) => {
    try {
      const { fileId } = req.params;
      const file = await FileModel.getByIdAll(fileId);
      const userId = (req as any).user.userId;

      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      const isUnique = await isUniqueFileName(userId, fileId, file.parentFolder);
      if (!isUnique) {
        return res.status(400).json({ message: 'File name already exists in the directory' });
      }

      await FileModel.restore(fileId);
      return res.json({ message: 'File restored successfully' });
    } catch (error) {
      console.error('Error restoring file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

fileRouter.post(
  '/:fileId/view',
  authorizeUser,
  checkPermission('view'),
  async (req, res) => {
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
  },
);

export default fileRouter;
