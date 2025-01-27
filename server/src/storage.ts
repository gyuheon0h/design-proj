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

export const bucket = storage.bucket(bucketName!);
/**
 * Check if a file exists in GCS.
 * @param filePath - The path of the file in the bucket.
 * @returns A boolean indicating whether the file exists.
 */
export const fileExists = async (filePath: string): Promise<boolean> => {
  const file = bucket.file(filePath);
  const [exists] = await file.exists();
  return exists;
};

/**
 * Stream a file from GCS.
 * @param filePath - The path of the file in the bucket.
 * @returns The read stream for the file.
 */
export const getFileStream = (filePath: string) => {
  const file = bucket.file(filePath);
  return file.createReadStream();
};

/**
 * Upload a file to GCS.
 * @param filePath - The path to save the file in the bucket.
 * @param buffer - The file data as a Buffer.
 * @param mimeType - The MIME type of the file.
 */
export const uploadFile = async (
  filePath: string,
  buffer: Buffer,
  mimeType: string,
) => {
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
};

/**
 * List all files in the GCS bucket.
 * @returns A list of file names in the bucket.
 */
export const listAllFiles = async (): Promise<string[]> => {
  try {
    const [files] = await bucket.getFiles();
    return files.map((file) => file.name); // Extract the file names
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
};
