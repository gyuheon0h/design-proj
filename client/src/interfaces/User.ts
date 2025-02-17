export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  deletedAt?: Date | null;
  email: string;
}
