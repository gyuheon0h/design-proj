import { Request, Response, NextFunction } from 'express';
import FolderModel from '../db_models/FolderModel';
import PermissionModel from '../db_models/PermissionModel';

type Role = 'viewer' | 'editor' | 'owner';

const blockedActions: Record<Role, string[]> = {
  viewer: ['delete', 'restore', 'move', 'share', 'rename'],
  editor: ['delete', 'restore'],
  owner: [],
};
// A middleware factory to check if the user has the correct permission for a given action
export const checkPermission = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      // Try to retrieve resourceId from various parameter names
      const resourceId =
        req.params.resourceId || req.params.fileId || req.params.folderId;
      if (!resourceId) {
        return res.status(400).json({ message: 'Resource ID missing' });
      }
      // first need to do a check on the resource id that we just got.
      const permission = await PermissionModel.getPermissionByFileAndUser(
        resourceId,
        userId,
      );
      console.log(permission);
      // if the permission doesn't exist on the file already, then we should bubble up
      if (permission) {
        const disallowed = blockedActions[permission.role as Role];
        console.log(disallowed);
        if (disallowed.length != 0 && disallowed.includes(action)) {
          return res
            .status(403)
            .json({ message: 'Forbidden: insufficient permissions' });
        }
      } else {
        // Use bubbleUpResource helper to check if the user can perform the action
        const hasAccess = await bubbleUpResource(resourceId, userId, action);
        if (!hasAccess) {
          return res
            .status(403)
            .json({ message: 'Forbidden: insufficient permissions' });
        }
      }
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };
};

export async function bubbleUpResource(
  resourceId: string,
  userId: string,
  action: string,
): Promise<boolean> {
  let folder = await FolderModel.getById(resourceId);
  while (folder) {
    const permission = await PermissionModel.getPermissionByFileAndUser(
      folder.id,
      userId,
    );

    if (permission) {
      const disallowed = blockedActions[permission.role as Role];
      if (disallowed && disallowed.includes(action)) {
        return false;
      }
      return true;
    }

    // Bubble up
    folder = folder.parentFolder
      ? await FolderModel.getById(folder.parentFolder)
      : null;
  }

  return false; // let's default it to true if we haven't found a file (usually indicates hitting a root directory).
}
