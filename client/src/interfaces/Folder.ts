export interface Folder {
  id: string;
  name: string;
  owner: string;
  createdAt: Date;
  parentFolder: string | null;
  folderChildren: string[];
  fileChildren: string[];
  isFavorited: boolean;
}
