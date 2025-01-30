import BaseModel from './baseModel';

interface User {
  id: string;
  username: string;
  createdAt: Date;
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
}

export default new UserModel();
