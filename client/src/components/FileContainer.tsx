import React from 'react';
import FileComponent from './File';
import axios from 'axios';
import { getUsernameById } from '../miscellHelpers/helperRequests';

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
  isFavorited: boolean;
}

interface FileContainerProps {
  page: 'home' | 'shared' | 'favorites' | 'trash';
  files: File[];
  currentFolderId: string | null;
  username: string; // logged in user
  refreshFiles: (folderId: string | null) => void;
}

const FileContainer: React.FC<FileContainerProps> = ({
  page,
  files,
  currentFolderId,
  refreshFiles,
  username,
}) => {
  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await axios.delete(
        `http://localhost:5001/api/file/delete/${fileId}`,
        {
          withCredentials: true,
        },
      );

      refreshFiles(currentFolderId);
      return response.data;
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };
  const handleRenameFile = async (fileId: string, fileName: string) => {
    try {
      const response = await axios.patch(
        `http://localhost:5001/api/file/rename/${fileId}`,
        { fileName },
        { withCredentials: true },
      );

      refreshFiles(currentFolderId);
      return response.data;
    } catch (error) {
      console.error('Error renaming file:', error);
    }
  };

  //FILE FAVORITING HANDLER, favorites the file given fileId
  const handleFavoriteFile = async (fileId: string, owner: string) => {
    const ownerUsername = await getUsernameById(owner);
    console.log(ownerUsername, username);
    if (ownerUsername !== username) {
      alert('You do not have permission to favorite this file.');
      return;
    }
    if (page === 'trash') {
      alert('You cannot favorite a file in the trash.');
      return;
    }
    try {
      const response = await axios.patch(
        `http://localhost:5001/api/file/favorite/${fileId}`,
        {},
        { withCredentials: true },
      );

      refreshFiles(currentFolderId);
      return response.data;
    } catch (error) {
      console.error('Error favoriting file:', error);
    }
  };

  const handleRestoreFile = async (fileId: string, owner: string) => {
    const ownerUsername = await getUsernameById(owner);
    console.log(ownerUsername, username);
    if (ownerUsername !== username) {
      alert('You do not have permission to restore this file.');
      return;
    }
    try {
      const response = await axios.patch(
        `http://localhost:5001/api/file/restore/${fileId}`,
        {},
        { withCredentials: true },
      );
      refreshFiles(currentFolderId);
      return response.data;
    } catch (error) {
      console.error('Error restoring file:', error);
    }
  };

  return (
    <div>
      {/* Header section with title and upload button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '15px',
        }}
      >
        {/* <Typography
          variant="h4"
          sx={{
            fontFamily: typography.fontFamily,
            fontSize: typography.fontSize.large,
            fontWeight: 'bold',
          }}
        >
          Files
        </Typography> */}
        {/* fix alignment for the above */}
        <h2>Files</h2>
      </div>

      {/* File List */}
      {files.map((file) => (
        <FileComponent
          page={page}
          key={file.id}
          id={file.id}
          name={file.name}
          owner={file.owner}
          createdAt={file.createdAt}
          lastModifiedBy={file.lastModifiedBy}
          lastModifiedAt={file.lastModifiedAt}
          parentFolder={file.parentFolder}
          gcsKey={file.gcsKey}
          isFavorited={file.isFavorited}
          fileType={file.fileType}
          handleDeleteFile={handleDeleteFile}
          handleRenameFile={handleRenameFile}
          handleRestoreFile={() => handleRestoreFile(file.id, file.owner)}
          handleFavoriteFile={() => handleFavoriteFile(file.id, file.owner)}
        />
      ))}
    </div>
  );
};

export default FileContainer;
