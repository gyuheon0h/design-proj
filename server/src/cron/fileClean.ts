import pool from '../dbModels/db';
import { File } from '../dbModels/FileModel';
import StorageService from '../storage';

async function cleanStaleFiles() {
  const deleteQuery = `
        DELETE FROM "File" 
        WHERE "deletedAt" IS NOT NULL and 
        "deletedAt" < NOW() - INTERVAL '30 days'
        RETURNING *`;

  try {
    const result = await pool.query(deleteQuery);
    console.log(
      `${new Date()}: Deleted ${result.rowCount} records that were soft deleted over 30 days ago.`,
    );

    const deletedFileRows: File[] = result.rows;

    if (deletedFileRows.length > 0) {
      for (const row of deletedFileRows) {
        const gcsKey = row.gcsKey;
        console.log(`Deleting file at path: ${gcsKey}`);
        await StorageService.deleteFile(gcsKey);
      }
    }
  } catch (error) {
    console.error(`${new Date()}: Error deleting file records:`, error);
  }
}

async function cleanStaleFolders() {
  const deleteQuery = `
          DELETE FROM "Folder" 
          WHERE "deletedAt" IS NOT NULL and 
          "deletedAt" < NOW() - INTERVAL '30 days'
          RETURNING *`;

  try {
    const result = await pool.query(deleteQuery);
    console.log(
      `${new Date()}: Deleted ${result.rowCount} records that were soft deleted over 30 days ago.`,
    );
  } catch (error) {
    console.error(`${new Date()}: Error deleting folder records:`, error);
  }
}
