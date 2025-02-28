export interface Permission {
  id: string;
  fileId: string; // or folderId if it's a folder
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  isFavorited: boolean;
  deletedAt: Date | null;
}
