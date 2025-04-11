import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Retrieve values from the environment
const bucketName = process.env.GCP_BUCKET_NAME;
const projectId = process.env.GCP_PROJECT_ID;
const keyFilePath = process.env.GCP_KEY_FILE_PATH;

const storage = new Storage({
  projectId: projectId,
  keyFilename: keyFilePath,
});

const bucket = storage.bucket(bucketName!);

const StorageService = {
  /**
   * Check if a file exists in GCS.
   * @param filePath - The path of the file in the bucket.
   * @returns A boolean indicating whether the file exists.
   */
  fileExists: async (filePath: string): Promise<boolean> => {
    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    return exists;
  },

  /**
   * Stream a file from GCS.
   * @param filePath - The path of the file in the bucket.
   * @returns The read stream for the file.
   */
  getFileStream: (filePath: string) => {
    const file = bucket.file(filePath);
    return file.createReadStream();
  },

  /**
   * Gets text contents from GCS
   * @param fileId - The path of the file in the bucket (GCS KEY)
   * @returns string repr of the file or empty string
   */
  getGCSFile: async (fileId: string) => {
    try {
      const file = bucket.file(fileId);
      const [contents] = await file.download();
      return contents.toString();
    } catch (error) {
      console.error('Error loading file from GCS:', error);
      return '';
    }
  },

  /**
   * Saves a file
   * @param fileId - The path of the file in the bucket
   * @param content  - the string content for that file
   */
  saveToGCS: async (fileId: string, content: string, mimeType: string) => {
    try {
      const file = bucket.file(fileId);
      // Save content to GCS
      await file.save(content, {
        metadata: { contentType: mimeType },
      });
    } catch (error) {
      console.error('Error saving file to GCS:', error);
    }
  },

  /**
   * Upload a file to GCS.
   * @param filePath - The path to save the file in the bucket.
   * @param buffer - The file data as a Buffer.
   * @param mimeType - The MIME type of the file.
   */
  uploadFile: async (filePath: string, buffer: Buffer, mimeType: string) => {
    const file = bucket.file(filePath);
    const stream = file.createWriteStream({
      metadata: {
        contentType: mimeType,
      },
    });

    return new Promise<void>((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', resolve);
      stream.end(buffer);
    });
  },

  /**
   * List all files in the GCS bucket.
   * @returns A list of file names in the bucket.
   */
  listAllFiles: async (): Promise<string[]> => {
    try {
      const [files] = await bucket.getFiles();
      return files.map((file) => file.name); // Extract the file names
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  },

  /**
   * Delete a file from GCS.
   * @param filePath - The path of the file in the bucket.
   */
  deleteFile: async (filePath: string): Promise<void> => {
    try {
      const file = bucket.file(filePath);
      await file.delete();
    } catch (error: any) {
      if (error.code === 404) {
        console.warn(`File not found: ${filePath}`);
      } else {
        console.error(`Error deleting file ${filePath}:`, error);
        throw error;
      }
    }
  },
};

export default StorageService;
