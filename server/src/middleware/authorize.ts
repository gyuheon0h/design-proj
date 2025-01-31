import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const authorize = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from cookies
    const token = req.cookies?.authToken;
    if (!token) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    (req as any).user = decoded; // decoded is {userId, username}

    next(); // Proceed to the next handler
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};
