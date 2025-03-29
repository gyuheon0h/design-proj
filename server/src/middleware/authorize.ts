import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import FolderModel from '../db_models/FolderModel';
import PermissionModel from '../db_models/PermissionModel';

dotenv.config();

export interface AuthenticatedRequest extends Request {
  user?: { userId: string; username: string };
}

export const authorize = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
  options: { resourceId?: string; userId?: string; actionName?: string } = {},
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

    // Silently log the optional params if provided
    if (options.resourceId && options.actionName && options.userId) {
      if (
        await bubbleUpResource(
          options.resourceId,
          options.userId,
          options.actionName,
        )
      ) {
        console.error('Unauthorized: No token provided');
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
      }
    }

    next(); // Proceed to the next handler
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

export async function bubbleUpResource(
  resourceId: string,
  userId: string,
  action: string,
): Promise<boolean> {
  // Start with the given folder
  let folder = await FolderModel.getById(resourceId);
  // Traverse up the folder hierarchy
  while (folder && folder.parentFolder !== null) {
    // Check if this folder is shared with the user
    const permission = await PermissionModel.getPermissionByFileAndUser(
      folder.id,
      userId,
    );

    if (permission) {
      // this indicates that we have an entry in the permission table
      if (permission.role === 'viewer') {
        if (
          action === 'delete' ||
          action === 'restore' ||
          action === 'move' ||
          action === 'share' ||
          action === 'rename'
        ) {
          return false;
        }
      } else if (permission.role === 'editor') {
        if (action === 'delete' || action === 'restore') {
          return false;
        }
      } else if (permission.role === 'owner') {
        // You're the GOAT
      }
      return true; // The folder is shared with the user
    }
    // Move up to the parent folder
    folder = await FolderModel.getById(folder.parentFolder);
  }

  return false; // No shared parent folder found
}
