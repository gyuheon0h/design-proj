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
   *
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
   * This function seeks to upload a file more gradually than dumping the entire file.
   * @param filePath The path of the file that we are attempting to upload.
   * @param buffer The size of the element that we've buffered.
   * @param mimeType the type of the file that we're working with.
   * @param onProgress The percent to update frontend with.
   * @param abortSignal Optional signal if aborted to cancel GCS operation.
   * @returns
   */

  uploadFileWithProgress: async (
    filePath: string,
    buffer: Buffer,
    mimeType: string,
    onProgress?: (percent: number) => void,
    abortSignal?: AbortSignal,
  ) => {
    const file = bucket.file(filePath);
    const stream = file.createWriteStream({
      metadata: { contentType: mimeType },
    });
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        stream.destroy(new Error('Upload aborted by user'));
      });
    }

    return new Promise<void>((resolve, reject) => {
      const chunkSize = 1024 * 64; // 64 KB chunks
      let offset = 0;
      const totalSize = buffer.length;
      function writeNextChunk() {
        const end = Math.min(offset + chunkSize, totalSize);
        const chunk = buffer.slice(offset, end);
        const canContinue = stream.write(chunk, () => {
          offset = end;
          const percent = Math.round((offset / totalSize) * 100);
          if (onProgress) onProgress(percent);

          if (offset < totalSize) {
            writeNextChunk();
          } else {
            stream.end();
          }
        });

        // If backpressure, wait for drain
        if (!canContinue) {
          stream.once('drain', writeNextChunk);
        }
      }

      stream.on('error', reject);
      stream.on('finish', resolve);

      writeNextChunk();
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
