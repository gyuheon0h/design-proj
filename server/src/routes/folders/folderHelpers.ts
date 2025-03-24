// WIP FILE IGNORE
import FolderModel from '../../db_models/FolderModel';
import PermissionModel from '../../db_models/PermissionModel';

export async function isNestedSharedFolder(
  folderId: string,
  userId: string,
): Promise<boolean> {
  // Start with the given folder
  let folder = await FolderModel.getById(folderId);
  // Traverse up the folder hierarchy
  while (folder && folder.parentFolder !== null) {
    // Check if this folder is shared with the user
    const permission = await PermissionModel.getPermissionByFileAndUser(
      folder.id,
      userId,
    );

    if (permission) {
      return true; // The folder is shared with the user
    }

    // Move up to the parent folder
    folder = await FolderModel.getById(folder.parentFolder);
  }

  return false; // No shared parent folder found
}
