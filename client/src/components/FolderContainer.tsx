import React, { useState, useEffect } from 'react';
import { Box, Button, Grow } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import ErrorAlert from '../components/ErrorAlert';
import { Folder } from '../interfaces/Folder';
import FolderComponent from './Folder';

interface FolderContainerProps {
  page: 'home' | 'shared' | 'favorites' | 'trash';
  folders: Folder[];
  onFolderClick: (folder: Folder) => void;
  currentFolderId: string | null;
  refreshFolders: (folderId: string | null) => void;
  username: string;
  searchQuery: string;
}

const FolderContainer: React.FC<FolderContainerProps> = ({
  page,
  folders,
  onFolderClick,
  currentFolderId,
  refreshFolders,
  username,
  searchQuery,
}) => {
  const itemsPerPage = 5;

  const [activeStartIndex, setActiveStartIndex] = useState(0);
  const [filteredFolders, setFilteredFolders] = useState<Folder[]>([]);
  const [visibleFolders, setVisibleFolders] = useState<Folder[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Compute visible folders based on current index
  const computeVisibleFolders = (startIndex: number, folderList: Folder[]) => {
    if (folderList.length <= itemsPerPage) {
      return folderList;
    }
    const visible: Folder[] = [];
    for (let i = 0; i < itemsPerPage; i++) {
      const index = (startIndex + i) % folderList.length;
      visible.push(folderList[index]);
    }
    return visible;
  };

  useEffect(() => {
    // Filter folders based on search query
    let foldersArray: Folder[] = [];

    if (Array.isArray(folders)) {
      foldersArray = folders;
    } else {
      foldersArray =
        typeof folders === 'object' &&
        folders !== null &&
        'folders' in folders &&
        'permissions' in folders
          ? (folders as { folders: Folder[]; permissions: any }).folders
          : [];
    }

    const updatedFilteredFolders = foldersArray.filter((folder) =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    setFilteredFolders(updatedFilteredFolders);
    setActiveStartIndex(0); // Reset pagination when search query changes
  }, [folders, searchQuery]);

  useEffect(() => {
    setVisibleFolders(computeVisibleFolders(activeStartIndex, filteredFolders));
  }, [filteredFolders, activeStartIndex]);

  const updateVisibleFolders = (newStartIndex: number) => {
    if (filteredFolders.length <= itemsPerPage) return;
    const len = filteredFolders.length;
    const wrappedIndex = ((newStartIndex % len) + len) % len;
    setActiveStartIndex(wrappedIndex);
    setVisibleFolders(computeVisibleFolders(wrappedIndex, filteredFolders));
  };

  const handleNext = () => {
    updateVisibleFolders(activeStartIndex + 1);
  };

  const handleBack = () => {
    updateVisibleFolders(activeStartIndex - 1);
  };

  // Determine whether looping/pagination is active
  const paginationActive = filteredFolders.length > itemsPerPage;

  return (
    <Box className="folder-container" sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '15px',
        }}
      >
        <h2>Folders</h2>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          px: 2,
          mb: 2,
        }}
      >
        <Button
          className="left-button"
          onClick={handleBack}
          disabled={!paginationActive}
        >
          <KeyboardArrowLeft />
        </Button>

        <Box
          className="visible-folders"
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
            alignItems: 'center',
            mx: 4,
          }}
        >
          {visibleFolders.map((folder, idx) => (
            <Grow in={true} timeout={500} key={`${folder.id}-${idx}`}>
              <div>
                <FolderComponent
                  page={page}
                  folder={folder}
                  onClick={() => onFolderClick(folder)}
                  refreshFolders={refreshFolders}
                />
              </div>
            </Grow>
          ))}
        </Box>

        <Button
          className="right-button"
          onClick={handleNext}
          disabled={!paginationActive}
        >
          <KeyboardArrowRight />
        </Button>
      </Box>

      {error && (
        <ErrorAlert
          open={!!error}
          message={error}
          onClose={() => setError(null)}
        />
      )}
    </Box>
  );
};

export default FolderContainer;

/*
<Carousel animation="slide">
      {
          items.map( (item, i) => 
            <Paper key={i}>
              <h2>{item.name}</h2>
              <p>{item.description}</p>
              <Button className="CheckButton">
                Check it out!
              </Button>
            </Paper>
          )
      }
  </Carousel>
*/
