import BaseModel from './baseModel';

interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  deletedAt?: Date | null;
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
}

export default new UserModel();
