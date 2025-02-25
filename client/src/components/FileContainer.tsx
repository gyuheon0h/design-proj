import React, { useState, useEffect } from 'react';
import FileComponent from './File';
import axios from 'axios';
import { getUsernameById } from '../utils/helperRequests';
import { File } from '../interfaces/File';
import ErrorAlert from '../components/ErrorAlert';
import { Grow } from '@mui/material';

interface FileContainerProps {
  page: 'home' | 'shared' | 'favorites' | 'trash';
  files: File[];
  currentFolderId: string | null;
  username: string; // logged-in user
  refreshFiles: (folderId: string | null) => void;
  searchQuery: string; // New prop for search input
}

const [error, setError] = useState<string | null>(null);

const FileContainer: React.FC<FileContainerProps> = ({
  page,
  files,
  currentFolderId,
  refreshFiles,
  username,
  searchQuery, // Receive search query
}) => {
  const [filteredFiles, setFilteredFiles] = useState<File[]>([]);

  useEffect(() => {
    // Filter files based on search query
    const updatedFilteredFiles = files.filter((file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    setFilteredFiles(updatedFilteredFiles);
  }, [files, searchQuery]);

  const handleDeleteFile = async (fileId: string) => {
    try {
      await axios.delete(`http://localhost:5001/api/file/delete/${fileId}`, {
        withCredentials: true,
      });

      refreshFiles(currentFolderId);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleRenameFile = async (fileId: string, fileName: string) => {
    try {
      await axios.patch(
        `http://localhost:5001/api/file/rename/${fileId}`,
        { fileName },
        { withCredentials: true },
      );

      refreshFiles(currentFolderId);
    } catch (error) {
      console.error('Error renaming file:', error);
    }
  };

  const handleFavoriteFile = async (fileId: string, owner: string) => {
    const ownerUsername = await getUsernameById(owner);

    if (ownerUsername !== username) {
      setError('You do not have permission to favorite this file.');
      return;
    }
    if (page === 'trash') {
      setError('You cannot favorite a file in the trash.');
      return;
    }
    try {
      await axios.patch(
        `http://localhost:5001/api/file/favorite/${fileId}`,
        {},
        { withCredentials: true },
      );

      refreshFiles(currentFolderId);
    } catch (error) {
      console.error('Error favoriting file:', error);
    }
  };

  const handleRestoreFile = async (fileId: string, owner: string) => {
    const ownerUsername = await getUsernameById(owner);

    if (ownerUsername !== username) {
      setError('You do not have permission to restore this file.');
      return;
    }
    try {
      await axios.patch(
        `http://localhost:5001/api/file/restore/${fileId}`,
        {},
        { withCredentials: true },
      );
      refreshFiles(currentFolderId);
    } catch (error) {
      console.error('Error restoring file:', error);
    }
  };

  return (
    <div>
      {/* Header section with title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '15px',
        }}
      >
        <h2>Files</h2>
      </div>

      {/* File List */}
      {filteredFiles.map((file) => (
        <Grow in={true} timeout={500} key={`${file.id}-${searchQuery}`}>
          <div>
            <FileComponent
              page={page}
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
          </div>
        </Grow>
      ))}
      {error && (
        <ErrorAlert
          open={!!error}
          message={error}
          onClose={() => setError(null)}
        />
      )}
    </div>
  );
};

export default FileContainer;
