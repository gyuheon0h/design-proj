import React, { useState, useEffect } from 'react';
import FileComponent from './File';
import axios from 'axios';
import { getUsernameById } from '../utils/helperRequests';
import { File } from '../interfaces/File';
import { Grow } from '@mui/material';

interface FileContainerProps {
  page: 'home' | 'shared' | 'favorites' | 'trash';
  files: File[];
  currentFolderId: string | null;
  refreshFiles: (folderId: string | null) => void;
  username: string; // logged-in user
  searchQuery: string; // New prop for search input
}

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
    const filesArray = Array.isArray(files) ? files : [];

    const updatedFilteredFiles = filesArray.filter((file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    setFilteredFiles(updatedFilteredFiles);
  }, [files, searchQuery]);

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
              file={file}
              refreshFiles={refreshFiles}
            />
          </div>
        </Grow>
      ))}
    </div>
  );
};

export default FileContainer;
