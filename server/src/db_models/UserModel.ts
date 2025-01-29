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
}

export default new UserModel();
