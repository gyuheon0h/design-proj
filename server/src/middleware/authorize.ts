import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
export interface AuthenticatedRequest extends Request {
  user?: { userId: string; username: string };
}

export const authorize = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get token from cookies
    const token = req.cookies?.authToken;
    if (!token) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      username: string;
    };
    req.user = decoded; // Set the user on the request object

    next(); // Proceed to the next handler
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};
