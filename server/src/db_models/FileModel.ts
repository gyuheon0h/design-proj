import BaseModel from './baseModel';

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

  // Update file metadata (e.g., name, last modified by)
  async updateFileMetadata(
    id: string,
    updatedData: Partial<File>,
  ): Promise<File | null> {
    return await this.update(id, updatedData);
  }
}

export default new FileModel();
