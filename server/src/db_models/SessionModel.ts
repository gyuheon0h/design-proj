import BaseModel from './baseModel';

interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
}

class SessionModel extends BaseModel<Session> {
  constructor() {
    super('Session');
  }

  // Get session by token
  async getSessionByToken(token: string): Promise<Session | null> {
    const sessions = await this.getAllByColumn('token', token);
    return sessions.length > 0 ? sessions[0] : null;
  }

  // Get all sessions for a specific user
  async getSessionsByUser(userId: string): Promise<Session[]> {
    return await this.getAllByColumn('userId', userId);
  }

  // Delete expired sessions
  async deleteExpiredSessions(): Promise<number> {
    return await this.hardDeleteOnCondition('expiresAt', new Date());
  }
}

export default new SessionModel();
