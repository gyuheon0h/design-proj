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
}

export default new UserModel();
