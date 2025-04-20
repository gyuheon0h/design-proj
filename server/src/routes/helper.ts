import FileModel from '../db_models/FileModel';
import FolderModel from '../db_models/FolderModel';
import PermissionModel, { Permission } from '../db_models/PermissionModel';

export async function bubbleUpResource(
  resourceId: string,
  userId: string,
  //   action: string,
): Promise<Permission | null> {
  let folder = await FolderModel.getById(resourceId);

  if (!folder) {
    let file = await FileModel.getById(resourceId);

    console.log('fileId found', file);

    if (!file) {
      return null;
    }

    const permission = await PermissionModel.getPermissionByFileAndUser(
      file.id,
      userId,
    );

    console.log('permission:', permission);

    if (permission) return permission;

    if (!file.parentFolder) {
      return null;
    }

    folder = await FolderModel.getById(file.parentFolder);
  }

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
