import FolderModel from '../db_models/FolderModel';
import PermissionModel, { Permission } from '../db_models/PermissionModel';

export async function bubbleUpResource(
  resourceId: string,
  userId: string,
  //   action: string,
): Promise<Permission | null> {
  let folder = await FolderModel.getById(resourceId);
  while (folder) {
    const permission = await PermissionModel.getPermissionByFileAndUser(
      folder.id,
      userId,
    );

    if (permission) {
      return permission;
    }

    folder = folder.parentFolder
      ? await FolderModel.getById(folder.parentFolder)
      : null;
  }

  return null;
}
