import { Request, Response, NextFunction } from 'express';
import FolderModel from '../db_models/FolderModel';
import PermissionModel from '../db_models/PermissionModel';

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

      // Use bubbleUpResource helper to check if the user can perform the action
      const hasAccess = await bubbleUpResource(resourceId, userId, action);
      if (!hasAccess) {
        // console.log('Error here!');
        return res
          .status(403)
          .json({ message: 'Forbidden: insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };
};

type Role = 'viewer' | 'editor' | 'owner';

const blockedActions: Record<Role, string[]> = {
  viewer: ['delete', 'restore', 'move', 'share', 'rename'],
  editor: ['delete', 'restore'],
  owner: [],
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

  return true; // let's default it to true if we haven't found a file (usually indicates hitting a root directory).
  // doesn't actually protect others from accessing file that are in the folder.
  // or unshared files.
  // hmm.
  // maybe we need to create some default folders for the user.
  // this sounds annoyingly difficult.
}
