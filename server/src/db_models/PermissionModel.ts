import BaseModel from './baseModel';

interface Permission {
  id: string;
  fileId: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
}

class PermissionModel extends BaseModel<Permission> {
  constructor() {
    super('Permission');
  }

  // Get all permissions for a specific file
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
  async updatePermission(id: string, data: Partial<Permission>): Promise<Permission | null> {
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
