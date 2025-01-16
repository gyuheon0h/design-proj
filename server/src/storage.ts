import { Storage } from "@google-cloud/storage";

// Initialize GCS client
const storage = new Storage();
const bucketName = "your-gcs-bucket-name";

export const bucket = storage.bucket(bucketName);

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
    stream.on("error", reject);
    stream.on("finish", resolve);
    stream.end(buffer);
  });
};
