import { Router, Request, Response } from 'express';
import {
  AuthenticatedRequest,
  authorizeUser,
} from '../../middleware/authorizeUser';
import { v4 as uuidv4 } from 'uuid';
import StorageService from '../../storage';
import FileModel from '../../db_models/FileModel';
import PermissionModel from '../../db_models/PermissionModel';
import { inferMimeType, isUniqueFileName } from './fileHelpers';
import { checkPermission } from '../../middleware/checkPermission';
import contentDisposition from 'content-disposition';
import { pipeline } from 'stream/promises';
import fs from 'fs';
import path from 'path';
import os from 'os';
import multer from 'multer';

const AbortError = new Error('UPLOAD_ABORTED');

const tempUploadDir = path.join(os.tmpdir(), 'owl-uploads');
fs.mkdirSync(tempUploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, tempUploadDir),
    filename: (_, file, cb) => {
      const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      cb(null, unique + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 1 * 1024 * 1024 * 1024 },
});

const fileRouter = Router();
// const upload = multer(); // Using memory storage to keep things minimal (TODO: implement streaming)

const sseClients = new Map<string, Response>();
/**
 * SSE End point in order to receive periodic events from the GCS.
 * This is a handler that, when a request arrives at this endpoint, processes it/triggers the logic in some way.
 */
fileRouter.get('/events/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // important to flush headers early

  // Send a "heartbeat" to keep the connection open
  const heartbeat = setInterval(() => {
    res.write(`event: ping\ndata: {}\n\n`);
  }, 30000);

  // Add this client to our SSE client map
  sseClients.set(userId, res);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(userId);
    res.end();
  });
});

/**
 * Helper to send SSE events
 * @param userId the user to which we are sending this event.
 * @param event the event
 * @param data
 */
function sendSSE(userId: string, event: string, data: any) {
  const client = sseClients.get(userId);
  console.log(`[SSE] ${userId} → ${event}`, data);

  if (client) {
    client.write(`event: ${event}\n`);
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

type UploadController = { abort: () => void };
const controllers = new Map<string, UploadController>(); // key = fileId

fileRouter.post(
  '/upload/cancel/:fileId',
  authorizeUser,
  (req: AuthenticatedRequest, res: Response) => {
    const { fileId } = req.params;
    const c = controllers.get(fileId);

    if (!c) return res.status(404).json({ error: 'No active upload' });

    c.abort(); // stop streams + clean tmp file
    controllers.delete(fileId);

    sendSSE(req.user!.userId, 'error', { fileId, message: 'Upload cancelled' });
    return res.json({ message: 'Upload cancelled' });
  },
);

fileRouter.get('/upload/:fileName/unique', authorizeUser, async (req, res) => {
  const rawParent = req.query.parentFolder;

  const parentFolder: string | null =
    typeof rawParent === 'string'
      ? rawParent
      : Array.isArray(rawParent) && typeof rawParent[0] === 'string'
        ? rawParent[0]
        : null;

  const { fileName } = req.params;

  if (!fileName) {
    return res.status(400).json({ message: 'No file name provided' });
  }

  const userId = (req as any).user.userId;

  // Check for duplicate file name in the folder
  const isUnique = await isUniqueFileName(userId, fileName, parentFolder);
  if (!isUnique) {
    return res
      .status(400)
      .json({ message: 'File name already exists in the directory' });
  }
  return res.status(200).json({
    message: 'File name is unique',
  });
});

/**
 * POST /api/files/upload
 * Route to upload a file
 */
fileRouter.post(
  '/upload',
  authorizeUser,
  upload.single('file'), // ← uses disk storage now
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: 'No file uploaded' });

      const { path: tempPath, originalname, mimetype, size } = req.file;
      const { parentFolder = null, fileName } = req.body;
      const userId = (req as any).user.userId;
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const userFiles = await FileModel.getFilesByOwner(userId);
      const totalUsed = userFiles.reduce(
        (sum, f) => sum + Number(f.fileSize),
        0,
      );
      const STORAGE_LIMIT = 15 * 1024 * 1024 * 1024;
      if (totalUsed + size > STORAGE_LIMIT) {
        fs.unlink(tempPath, () => {});
        return res.status(400).json({ error: 'Storage limit exceeded' });
      }

      const fileId = req.body.fileId || uuidv4();
      const gcsKey = `uploads/${userId}/${parentFolder || 'root'}/${fileId}-${originalname}`;
      /* ---------- STREAM UPLOAD ---------- */
      const readStream = fs.createReadStream(tempPath);
      const writeStream = StorageService.getWriteStream(gcsKey, mimetype);

      const controller: UploadController = {
        abort() {
          readStream.destroy(AbortError); // triggers both streams’ 'close'
          writeStream.destroy(AbortError);
          fs.unlink(tempPath, () => {}); // remove temp file
        },
      };
      controllers.set(fileId, controller);

      let uploaded = 0,
        lastPct = -1;
      readStream.on('data', (chunk) => {
        uploaded += chunk.length;
        const pct = Math.floor((uploaded / size) * 100);
        if (pct > lastPct) {
          sendSSE(userId, 'progress', { fileId, percent: pct });
          lastPct = pct;
        }
      });

      try {
        await pipeline(readStream, writeStream);
      } catch (err: any) {
        if (err === AbortError) {
          // graceful cancel: just return after cleaning map
          controllers.delete(fileId);
          return; // do NOT continue to DB save
        }
        throw err; // genuine error → catch below
      } finally {
        controllers.delete(fileId); // ensure cleanup both paths
        fs.unlink(tempPath, () => {}); // remove tmp even on success
      }
      /* ---------- END STREAM ---------- */

      const fileMeta = await FileModel.create({
        id: fileId,
        name: fileName,
        owner: userId,
        createdAt: new Date(),
        lastModifiedBy: null,
        lastModifiedAt: new Date(),
        parentFolder: parentFolder || null,
        gcsKey,
        fileType: mimetype,
        fileSize: size,
      });
      await PermissionModel.createPermission({
        fileId: fileId,
        userId,
        role: 'owner',
      });

      sendSSE(userId, 'done', { fileId });
      return res.status(201).json({ message: 'File uploaded', file: fileMeta });
    } catch (err) {
      console.error('Upload failed:', err);
      const id = (req as any).user?.userId;
      if (id) sendSSE(id, 'error', { message: 'Upload failed' });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

fileRouter.get('/download/:fileId', authorizeUser, async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await FileModel.getById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const fileStream = await StorageService.getFileStream(file.gcsKey);
    res.setHeader('Content-Type', file.fileType);
    res.setHeader('Content-Disposition', contentDisposition(file.name));
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
/**
 * Cancellation route by fileid
 */
fileRouter.post('/upload/cancel/:fileId', authorizeUser, (req, res) => {
  const { fileId } = req.params;
  const controller = controllers.get(fileId);

  if (!controller) {
    return res.status(404).json({ error: 'No active upload for this file' });
  }

  controller.abort();
  controllers.delete(fileId);

  const userId = (req as any).user.userId;
  sendSSE(userId, 'error', { fileId, message: 'Upload cancelled by user' });
  return res.json({ message: 'Upload cancelled' });
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

    let finalFileName = fileName;
    if (!finalFileName.endsWith('.owlnote')) {
      finalFileName += '.owlnote';
    }

    const isUnique = await isUniqueFileName(
      userId,
      finalFileName,
      parentFolder,
    );
    if (!isUnique) {
      return res
        .status(400)
        .json({ message: 'File name already exists in the directory' });
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
      // res.setHeader(
      //   'Content-Disposition',
      //   `attachment; filename="${file.name}"`,
      // );
      res.setHeader('Content-Disposition', contentDisposition(file.name));
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error downloading file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

// fileRouter.get(
//   '/:fileId/download',
//   authorizeUser,
//   checkPermission('download'),
//   async (req, res) => {
//     try {
//       const { fileId } = req.params;
//       const file = await FileModel.getById(fileId);

//       if (!file) {
//         return res.status(404).json({ message: 'File not found' });
//       }

//       const fileStream = await StorageService.getFileStream(file.gcsKey);
//       res.setHeader(
//         'Content-Disposition',
//         `attachment; filename="${file.name}"`,
//       );
//       fileStream.pipe(res);
//     } catch (error) {
//       console.error('Error downloading file:', error);
//       return res.status(500).json({ error: 'Internal Server Error' });
//     }
//   },
// );
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

fileRouter.delete(
  '/:fileId/hard-delete',
  authorizeUser,
  checkPermission('delete'),
  async (req, res) => {
    try {
      const { fileId } = req.params;
      const file = await FileModel.getById(fileId);

      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Delete file from GCS
      await StorageService.deleteFile(file.gcsKey);
      // this is a little hazardous; this is a hard delete on the GCS;
      // and should not occur

      // Delete from database
      await FileModel.hardDeleteFile(fileId);

      return res.json({ message: 'File hard deleted successfully' });
    } catch (error) {
      console.error('Error hard deleting file:', error);
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
      const isUnique = await isUniqueFileName(
        userId,
        resourceName,
        file.parentFolder,
      );
      if (!isUnique) {
        return res
          .status(400)
          .json({ message: 'File name already exists in the directory' });
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
        return res
          .status(400)
          .json({ message: 'File name already exists in the directory' });
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

      const isUnique = await isUniqueFileName(
        userId,
        fileId,
        file.parentFolder,
      );
      if (!isUnique) {
        return res
          .status(400)
          .json({ message: 'File name already exists in the directory' });
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
