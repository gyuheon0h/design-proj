import BaseModel from './baseModel';

interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  deletedAt?: Date | null;
  email: string;
}

class UserModel extends BaseModel<User> {
  constructor() {
    super('User');
  }

  // Check if a user with the given username already exists
  async userExists(username: string): Promise<boolean> {
    const users = await this.getAllByColumn('username', username);
    return users.length > 0; // Returns true if user exists, otherwise false
  }

  // Get user by username (for login verification)
  async getUserByUsername(username: string): Promise<User | null> {
    const users = await this.getAllByColumn('username', username);
    return users.length > 0 ? users[0] : null;
  }

  async getUsernameById(id: string): Promise<string> {
    const user = await this.getById(id);
    return user ? user.username : '';
  }

  // Delete user account - uses soft delete by default
  async delete(userId: string): Promise<boolean> {
    try {
      return await this.softDelete(userId);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Permanently delete user account - use with caution
  async hardDelete(userId: string): Promise<number> {
    try {
      return await this.hardDeleteOnCondition('id', userId);
    } catch (error) {
      console.error('Error permanently deleting user:', error);
      throw error;
    }
  }

  // Restore a soft-deleted user account
  async restoreUser(userId: string): Promise<boolean> {
    try {
      return await this.restore(userId);
    } catch (error) {
      console.error('Error restoring user:', error);
      throw error;
    }
  }
}

export default new UserModel();
