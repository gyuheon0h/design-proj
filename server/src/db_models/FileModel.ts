import BaseModel from './baseModel';
import { recursiveDeletePermissions } from './ModelHelpers';

interface File {
  id: string;
  name: string;
  owner: string;
  createdAt: Date;
  lastModifiedBy: string | null;
  lastModifiedAt: Date;
  parentFolder: string | null;
  gcsKey: string;
  fileType: string;
  fileSize: number;
  deletedAt: Date | null;
}

class FileModel extends BaseModel<File> {
  constructor() {
    super('File');
  }

  // Get all files owned by a specific user
  async getFilesByOwner(ownerId: string): Promise<File[]> {
    return await this.getAllByColumn('owner', ownerId);
  }

  // Get all files in a specific folder
  async getFilesByFolder(folderId: string): Promise<File[]> {
    return await this.getAllByColumn('parentFolder', folderId);
  }

  async getFilesByOwnerAndFolder(
    ownerId: string,
    parentFolderId: string | null,
  ): Promise<File[]> {
    if (parentFolderId === null) {
      return await this.getAllByOwnerAndColumnNull(ownerId, 'parentFolder');
    }
    return await this.getAllByOwnerAndColumn(
      ownerId,
      'parentFolder',
      parentFolderId,
    );
  }

  // Update file metadata (e.g., name, last modified by)
  async updateFileMetadata(
    id: string,
    updatedData: Partial<File>,
  ): Promise<File | null> {
    return await this.update(id, updatedData);
  }

  // Soft delete a file
  async deleteFile(id: string): Promise<boolean> {
    recursiveDeletePermissions(id, null);
    return await this.softDelete(id);
  }

  // Restore a file
  async restoreFile(id: string): Promise<boolean> {
    return await this.restore(id);
  }
}

export default new FileModel();
