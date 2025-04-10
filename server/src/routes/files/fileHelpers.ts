// WIP FILE IGNORE
import FolderModel from '../../dbModels/FolderModel';
import PermissionModel from '../../dbModels/PermissionModel';

const extensionToMimeType: { [key: string]: string } = {
  ts: 'application/x-typescript',
  tsx: 'application/x-typescript',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  txt: 'text/plain',
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  json: 'application/json',
  xml: 'application/xml',
  csv: 'text/csv',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  mp4: 'video/mp4',
  avi: 'video/x-msvideo',
  mov: 'video/quicktime',
  zip: 'application/zip',
  tar: 'application/x-tar',
  rar: 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  exe: 'application/octet-stream',
  bin: 'application/octet-stream',
  c: 'text/x-csrc',
  cpp: 'text/x-c++src',
  h: 'text/x-c-header',
  hpp: 'text/x-c++hdr',
  java: 'text/x-java-source',
  py: 'text/x-python',
  rb: 'text/x-ruby',
  php: 'application/x-httpd-php',
  go: 'text/x-go',
  rs: 'text/x-rust',
  swift: 'text/x-swift',
  kt: 'text/x-kotlin',
  sh: 'application/x-sh',
  pl: 'text/x-perl',
  lua: 'text/x-lua',
  r: 'text/x-r-source',
  dart: 'application/dart',
  cs: 'text/x-csharp',
  scala: 'text/x-scala',
  vb: 'text/x-vbscript',
  asm: 'text/x-assembly',
  sql: 'application/sql',
};

export function inferMimeType(filename: string): string {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  return extensionToMimeType[ext] || 'application/octet-stream';
}

export async function isNestedSharedFile(
  fileId: string,
  userId: string,
): Promise<boolean> {
  // Get the file's parent folder
  let folder = await FolderModel.getById(fileId);

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
