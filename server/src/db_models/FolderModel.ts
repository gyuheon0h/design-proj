import BaseModel from './baseModel';
import FileModel from './FileModel';
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

class FolderModel extends BaseModel<Folder> {
  constructor() {
    super('Folder');
  }

  // Get all folders owned by a specific user using BaseModel method
  async getFoldersByOwner(ownerId: string): Promise<Folder[]> {
    return await this.getAllByColumn('owner', ownerId);
  }

  /**
   * Get all subfolders of a folder for a specific user
   * @param ownerId
   * @param parentFolderId
   * @returns
   */
  async getSubfoldersByOwner(
    ownerId: string,
    parentFolderId: string | null,
  ): Promise<Folder[]> {
    if (parentFolderId === null) {
      return await this.getAllByOwnerAndColumnNull(ownerId, 'parentFolder');
    }
    return await this.getAllByOwnerAndColumn(
      ownerId,
      'parentFolder',
      parentFolderId,
    );
  }

  async getSubfolders(parentFolderId: string | null): Promise<Folder[]> {
    return await this.getAllByColumn('parentFolder', parentFolderId);
  }

  // Soft delete a folder
  async deleteFolder(id: string): Promise<boolean> {
    console.log('PELASE');
    // before just deleting a folder, I need to soft delete a bunch of functions.
    // I need to reverse look up the fileId by getting that, then checking
    // we need to work on getting this to switch.
    // let permissionEntry: Permission | null = await PermissionModel.getById(id);

    // if (permissionEntry == null) {
    //   console.log('did it equal null');
    //   return false; // does not exist; should not occur.
    // }
    //permissionEntry.fileId
    console.log('does this appear?>');
    await this.recursiveDelete(id);
    return await this.softDelete(id);
  }
  /**
   * This is a helper function that recurses down and deletes all of
   * the permissions that need to be deleted.
   * @param id the string of the current folderId/fileId we are trying to delete.
   */
  async recursiveDelete(resourceId: string) {
    console.log('how is this possible');
    // we need to get all of the permission entries for the current element
    let allPermsOnResourceId: Permission[] =
      await PermissionModel.getAllByColumn('fileId', resourceId); // this is really the resourceId
    // for every permission entry
    for (let i = 0; i < allPermsOnResourceId.length; i++) {
      // I need to delete the permission entry based on the permission's id
      if (allPermsOnResourceId[i].role !== 'owner') {
        PermissionModel.hardDeletePermission(allPermsOnResourceId[i].id);
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
          PermissionModel.hardDeletePermission(filePerms[j].id);
        }
      }
    }
    let folderChilds: Folder[] = await this.getAllByColumn(
      'parentFolder',
      resourceId,
    );
    for (let j = 0; j < folderChilds.length; j++) {
      // delete all of the permission that were found on the folders.
      this.recursiveDelete(folderChilds[j].id); // thse are folder ids
    }
  }

  // Restore a folder
  async restoreFolder(id: string): Promise<boolean> {
    return await this.restore(id);
  }

  // Create a folder
  async createFolder(data: Omit<Folder, 'id'>): Promise<Folder> {
    return await this.create(data);
  }

  // Get foldername by id
  async getFolderName(id: string): Promise<string> {
    const folder = await this.getById(id);
    return folder?.name || '';
  }

  // Update folder metadata (e.g., name)
  async updateFolderMetadata(
    id: string,
    updatedData: Partial<Folder>,
  ): Promise<Folder | null> {
    return await this.update(id, updatedData);
  }
}

export default new FolderModel();
