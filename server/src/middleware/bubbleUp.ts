import { FolderModel } from '../models/folder.model';
import { PermissionModel } from '../models/permission.model';

const blockedActions = {
  viewer: ['delete', 'restore', 'move', 'share', 'rename'],
  editor: ['delete', 'restore'],
  owner: [], // Full access
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
      const disallowed =
        blockedActions[permission.role as keyof typeof blockedActions];
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

  return false;
}
