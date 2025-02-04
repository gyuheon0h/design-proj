import BaseModel from './baseModel';

interface Folder {
  id: string;
  name: string;
  owner: string;
  createdAt: Date;
  parentFolder: string | null;
  folderChildren: string[];
  fileChildren: string[];
}

class FolderModel extends BaseModel<Folder> {
  constructor() {
    super('Folder');
  }

  // Get all folders owned by a specific user using BaseModel method
  async getFoldersByOwner(ownerId: string): Promise<Folder[]> {
    return await this.getAllByColumn('owner', ownerId);
  }

  /**
   * Get all subfolders of a folder for a specific user
   * @param ownerId
   * @param parentFolderId
   * @returns
   */
  async getSubfolders(
    ownerId: string,
    parentFolderId: string | null,
  ): Promise<Folder[]> {
    if (parentFolderId === null) {
      return await this.getAllByOwnerAndColumnNull(ownerId, 'parentFolder');
    }
    return await this.getAllByOwnerAndColumn(
      ownerId,
      'parentFolder',
      parentFolderId,
    );
  }

  // Soft delete a folder
  async deleteFolder(id: string): Promise<boolean> {
    return await this.softDelete(id);
  }

  // Restore a folder
  async restoreFolder(id: string): Promise<boolean> {
    return await this.restore(id);
  }

  // Create a folder
  async createFolder(data: Omit<Folder, 'id'>): Promise<Folder> {
    return await this.create(data);
  }
}

export default new FolderModel();
