import { Router } from 'express';
import { AuthenticatedRequest, authorize } from '../../middleware/authorize';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import StorageService from '../../storage';
import FileModel from '../../db_models/FileModel';

const fileRouter = Router();
const upload = multer(); // Using memory storage to keep things minimal (TODO: implement streaming)

fileRouter.get('/root', authorize, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const files = await FileModel.getFilesByOwnerAndFolder(userId, null);
    return res.json(files);
  } catch (error) {
    console.error('Error getting root folder files:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

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

      return res.json(files);
    } catch (error) {
      console.error('Error getting files by folder:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

/**
 * GET /api/files/favorites/:ownerId
 * Route to get favorited files owned by a certain user (ownerId).
 * This is protected by authorize
 */

//TODO: made an attempt at writing the favorites endpoint but got stuck lol
// fileRouter.get('/favorites/:ownerId', authorize, async (req, res) => {
//   try {
//     const { ownerId } = req.params;

//     // ******** CHECK THIS OUT If we only want to let users get their own files
//     if ((req as any).user.userId !== ownerId) {
//       return res
//         .status(403)
//         .json({
//           message: 'Forbidden: You can only access your own favorited files.',
//         });
//     }

//     const favoritedFiles = await FileModel.getAllByOwnerAndColumn(
//       ownerId,
//       'isFavorited',
//       true,
//     );
//     return res.json(favoritedFiles);
//   } catch (error) {
//     console.error('Error getting files by owner:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

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

      const { originalname, buffer, mimetype } = req.file;
      const { parentFolder = null, fileName } = req.body;
      const userId = (req as any).user.userId;

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

export default fileRouter;
