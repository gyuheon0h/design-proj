import React, { useState, useEffect } from 'react';
import FileComponent from './File';
import { File } from '../interfaces/File';
import ErrorAlert from '../components/ErrorAlert';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  Typography,
} from '@mui/material';

interface FileContainerProps {
  page: 'home' | 'shared' | 'favorites' | 'trash';
  files: File[];
  currentFolderId: string | null; // currentparentfolderid
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Filter files based on search query
    const updatedFilteredFiles = files.filter((file: File) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    setFilteredFiles(updatedFilteredFiles);
  }, [files, searchQuery]);

  return (
    <div style={{ userSelect: 'none' }}>
      {/* Header section with title */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '15px',
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h2">Files</Typography>
      </Box>

      <Table sx={{ tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '35%', fontWeight: 'bold' }}>
              Name
            </TableCell>
            <TableCell sx={{ width: '15%', fontWeight: 'bold' }}>
              Created
            </TableCell>
            <TableCell sx={{ width: '20%', fontWeight: 'bold' }}>
              Owner
            </TableCell>
            <TableCell sx={{ width: '20%', fontWeight: 'bold' }}>
              Last Modified
            </TableCell>
            <TableCell sx={{ width: '10%' }}></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredFiles.map((file) => (
            <FileComponent
              key={`${file.id}-${searchQuery}`}
              page={page}
              file={file}
              refreshFiles={refreshFiles}
            />
          ))}
        </TableBody>
      </Table>

      {filteredFiles.length === 0 && (
        <Box sx={{ textAlign: 'center', padding: '30px' }}>
          <Typography variant="body1">No files found</Typography>
        </Box>
      )}

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
