import { Request, Response, NextFunction } from 'express';
import BaseModel from '../db_models/baseModel';

interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
}

interface User {
  id: string;
  username: string;
}

// instatiate models
const sessionModel = new BaseModel<Session>('Session');
const userModel = new BaseModel<User>('User');

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      username?: string;
    }
  }
}

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.token; // get tokens from the chocolate chip cookies

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    // fetch session using token
    const session = await sessionModel.getAllByColumn('token', token);
    if (!session.length || new Date(session[0].expiresAt) < new Date()) {
      return res
        .status(401)
        .json({ error: 'Unauthorized: Invalid or expired token' });
    }

    const user = await userModel.getById(session[0].userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    // attach user info to request object
    req.userId = user.id;
    req.username = user.username;

    next(); // continue to the next middleware or route
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
