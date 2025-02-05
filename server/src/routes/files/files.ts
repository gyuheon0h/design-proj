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
fileRouter.get(
  '/folder/:folderId',
  authorize,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { folderId } = req.params;
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const userId = req.user.userId;

      let files;
      if (folderId === 'null') {
        files = await FileModel.getFilesByOwnerAndFolder(userId, null);
      } else {
        files = await FileModel.getFilesByOwnerAndFolder(userId, folderId);
      }

      return res.json(files);
    } catch (error) {
      console.error('Error getting files by folder:', error);
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

export default fileRouter;
