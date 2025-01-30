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

  // Get all subfolders of a folder
  async getSubfolders(parentFolderId: string): Promise<Folder[]> {
    return await this.getAllByColumn('parentFolder', parentFolderId);
  }

  // Soft delete a folder
  async deleteFolder(id: string): Promise<boolean> {
    return await this.softDelete(id);
  }

  // Restore a folder
  async restoreFolder(id: string): Promise<boolean> {
    return await this.restore(id);
  }
}

export default new FolderModel();
