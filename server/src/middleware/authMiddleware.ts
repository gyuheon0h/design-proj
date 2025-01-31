import { Request, Response, NextFunction } from 'express';
import SessionModel from '../db_models/SessionModel';
import UserModel from '../db_models/UserModel';

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
    const session = await SessionModel.getSessionByToken(token);
    if (!session || new Date(session.expiresAt) < new Date()) {
      return res
        .status(401)
        .json({ error: 'Unauthorized: Invalid or expired token' });
    }

    const user = await UserModel.getById(session.userId);
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
