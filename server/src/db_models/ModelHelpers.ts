import FileModel from './FileModel';
import FolderModel from './FolderModel';
import PermissionModel from './PermissionModel';
interface Folder {
  id: string;
  name: string;
  owner: string;
  createdAt: Date;
  deletedAt: Date | null;
  parentFolder: string | null;
}
interface Permission {
  id: string;
  fileId: string; // includes folders
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  isFavorited: boolean;
  deletedAt: Date | null;
}
interface File {
  id: string;
  name: string;
  owner: string;
  createdAt: Date;
  lastModifiedBy: string | null;
  lastModifiedAt: Date;
  parentFolder: string | null;
  gcsKey: string;
  fileType: string;
  deletedAt: Date | null;
}
/**
 * This is a helper function that recurses down and deletes all of
 * the permissions that need to be deleted.
 * @param id the string of the current folderId/fileId we are trying to delete.
 */
export async function recursiveDeletePermissions(
  resourceId: string,
  filterUserId: string | null,
) {
  // we need to get all of the permission entries for the current element
  let allPermsOnResourceId: Permission[] = await PermissionModel.getAllByColumn(
    'fileId',
    resourceId,
  ); // this is really the resourceId
  // for every permission entry on this given resource
  for (let i = 0; i < allPermsOnResourceId.length; i++) {
    // I need to delete the permission entry based on the permission's id
    if (allPermsOnResourceId[i].role !== 'owner') {
      if (
        filterUserId === null ||
        allPermsOnResourceId[i].userId === filterUserId
      ) {
        await PermissionModel.hardDeletePermission(allPermsOnResourceId[i].id);
      }
    }
  }
  // then, I need to go through all of my files
  let fileChildren: File[] = await FileModel.getAllByColumn(
    'parentFolder',
    resourceId,
  );
  // and then I need to delete all of their permissions
  for (let i = 0; i < fileChildren.length; i++) {
    let curr_child: File = fileChildren[i];
    let filePerms: Permission[] = await PermissionModel.getAllByColumn(
      'fileId',
      curr_child.id,
    );
    for (let j = 0; j < filePerms.length; j++) {
      // delete all of the permission that were found on this folder.
      if (allPermsOnResourceId[j].role !== 'owner') {
        if (filterUserId === null || filePerms[i].userId === filterUserId) {
          await PermissionModel.hardDeletePermission(filePerms[j].id);
        }
      }
    }
  }
  let folderChilds: Folder[] = await FolderModel.getAllByColumn(
    'parentFolder',
    resourceId,
  );
  for (let j = 0; j < folderChilds.length; j++) {
    // delete all of the permission that were found on the folders.
    recursiveDeletePermissions(folderChilds[j].id, filterUserId); // thse are folder ids
  }
}
