import BaseModel from './baseModel';

export interface Permission {
  id: string;
  fileId: string; // includes folders
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  isFavorited: boolean;
  deletedAt: Date | null;
}

class PermissionModel extends BaseModel<Permission> {
  constructor() {
    super('Permission');
  }

  // Get all permissions for a specific file/folder
  async getPermissionsByFileId(fileId: string): Promise<Permission[]> {
    try {
      return await this.getAllByColumn('fileId', fileId);
    } catch (error) {
      console.error('Error retrieving permissions by fileId:', error);
      throw error;
    }
  }

  // Get all permissions for a specific user
  async getPermissionsByUserId(userId: string): Promise<Permission[]> {
    try {
      return await this.getAllByColumn('userId', userId);
    } catch (error) {
      console.error('Error retrieving permissions by userId:', error);
      throw error;
    }
  }

  /**
   * Get a permission by fileId and userId (excluding soft-deleted).
   */
  async getPermissionByFileAndUser(
    fileId: string,
    userId: string,
  ): Promise<Permission | null> {
    try {
      return await this.getOneByMultipleColumns({ fileId, userId }, false);
    } catch (error) {
      console.error('Error getting permission by fileId/userId:', error);
      throw error;
    }
  }

  // Get permission rows where fileId is a File based on userId
  async getFilesByUserId(userId: string): Promise<Permission[]> {
    try {
      return await this.getAllByJoin(
        'File',
        'baseTable."fileId" = joinTbl."id"',
        'userId',
        userId,
        true,
      );
    } catch (error) {
      console.error('Error retrieving file permissions by userId:', error);
      throw error;
    }
  }

  // Get permission rows where folderId is a Folder based on userId
  // baseTable is Permission
  async getFoldersByUserId(userId: string): Promise<Permission[]> {
    try {
      return await this.getAllByJoin(
        'Folder', // joinTable
        'baseTable."fileId" = joinTbl."id"', // onCondition
        'userId', // column in Permission
        userId, // actual value
        true, // check joinTbl.deletedAt
      );
    } catch (error) {
      console.error('Error retrieving folder permissions by userId:', error);
      throw error;
    }
  }

  // Create a new permission
  async createPermission(data: Partial<Permission>): Promise<Permission> {
    try {
      return await this.create(data);
    } catch (error) {
      console.error('Error creating permission:', error);
      throw error;
    }
  }

  // Update an existing permission
  async updatePermission(
    id: string,
    data: Partial<Permission>,
  ): Promise<Permission | null> {
    try {
      return await this.update(id, data);
    } catch (error) {
      console.error('Error updating permission:', error);
      throw error;
    }
  }

  // Permanently delete a permission (hard delete)
  async hardDeletePermission(id: string): Promise<number> {
    try {
      return await this.hardDeleteOnCondition('id', id);
    } catch (error) {
      console.error('Error permanently deleting permission:', error);
      throw error;
    }
  }
}

export default new PermissionModel();
