import { Request, Response, NextFunction } from 'express';
import PermissionModel, { Permission } from '../db_models/PermissionModel';
import { bubbleUpResource } from '../routes/helper';

type Role = 'viewer' | 'editor' | 'owner';

// allowed actions for any accessor: download and view

const blockedActions: Record<Role, string[]> = {
  viewer: ['delete', 'restore', 'move', 'share', 'rename', 'upload'],
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

      const resourceId =
        req.params.resourceId || req.params.fileId || req.params.folderId;
      if (!resourceId) {
        return res.status(400).json({ message: 'Resource ID missing' });
      }

      const permission = await PermissionModel.getPermissionByFileAndUser(
        resourceId,
        userId,
      );

      if (permission) {
        const disallowed = blockedActions[permission.role as Role];
        if (disallowed.length !== 0 && disallowed.includes(action)) {
          return res
            .status(403)
            .json({ message: 'Forbidden: insufficient permissions' });
        }
      } else {
        const bubbledPermission = await bubbleUpResource(resourceId, userId);
        if (!bubbledPermission) {
          return res
            .status(403)
            .json({ message: 'Forbidden: insufficient permissions' });
        }

        const disallowed = blockedActions[bubbledPermission.role as Role];
        if (disallowed.length !== 0 && disallowed.includes(action)) {
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
