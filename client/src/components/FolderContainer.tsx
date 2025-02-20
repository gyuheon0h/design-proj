import React, { useState, useEffect } from 'react';
import { Box, Button, Slider } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import Folder, { FolderProps } from './Folder';
import axios from 'axios';
import { getUsernameById } from '../utils/helperRequests';

interface FolderContainerProps {
  page: 'home' | 'shared' | 'favorites' | 'trash';
  folders: FolderProps[];
  onFolderClick: (folder: FolderProps) => void;
  currentFolderId: string | null;
  refreshFolders: (folderId: string | null) => void;
  username: string;
  searchQuery: string; // New prop for search input
}

const FolderContainer: React.FC<FolderContainerProps> = ({
  page,
  folders,
  onFolderClick,
  currentFolderId,
  refreshFolders,
  username,
  searchQuery, // Receive search query
}) => {
  const itemsPerPage = 5;

  const [activeStartIndex, setActiveStartIndex] = useState(0);
  const [filteredFolders, setFilteredFolders] = useState<FolderProps[]>([]);
  const [visibleFolders, setVisibleFolders] = useState<FolderProps[]>([]);

  useEffect(() => {
    // Filter folders based on search query
    const updatedFilteredFolders = folders.filter((folder) =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    setFilteredFolders(updatedFilteredFolders);
    setActiveStartIndex(0); // Reset pagination when search query changes
  }, [folders, searchQuery]);

  useEffect(() => {
    setVisibleFolders(
      filteredFolders.slice(activeStartIndex, activeStartIndex + itemsPerPage),
    );
  }, [filteredFolders, activeStartIndex, itemsPerPage]);

  const sliderMax = Math.max(filteredFolders.length - itemsPerPage, 0);

  const updateVisibleFolders = (newStartIndex: number) => {
    setActiveStartIndex(newStartIndex);
    setVisibleFolders(
      filteredFolders.slice(newStartIndex, newStartIndex + itemsPerPage),
    );
  };

  const handleNext = () => {
    if (activeStartIndex + itemsPerPage < filteredFolders.length) {
      updateVisibleFolders(activeStartIndex + 1);
    }
  };

  const handleBack = () => {
    if (activeStartIndex > 0) {
      updateVisibleFolders(activeStartIndex - 1);
    }
  };

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    if (typeof newValue === 'number') {
      updateVisibleFolders(newValue);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await axios.delete(
        `http://localhost:5001/api/folder/delete/${folderId}`,
        {
          withCredentials: true,
        },
      );
      refreshFolders(currentFolderId);
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  };

  const handleFavoriteFolder = async (folderId: string, owner: string) => {
    const ownerUsername = await getUsernameById(owner);
    if (ownerUsername !== username) {
      alert('You do not have permission to favorite this folder.');
      return;
    }
    try {
      await axios.patch(
        `http://localhost:5001/api/folder/favorite/${folderId}`,
        {},
        {
          withCredentials: true,
        },
      );
      refreshFolders(currentFolderId);
    } catch (error) {
      console.error('Error favoriting folder:', error);
    }
  };

  const handleRestoreFolder = async (folderId: string, owner: string) => {
    const ownerUsername = await getUsernameById(owner);
    if (ownerUsername !== username) {
      alert('You do not have permission to restore this folder.');
      return;
    }
    try {
      await axios.patch(
        `http://localhost:5001/api/folder/restore/${folderId}`,
        {},
        {
          withCredentials: true,
        },
      );
      refreshFolders(currentFolderId);
    } catch (error) {
      console.error('Error restoring folder:', error);
    }
  };

  const handleRenameFolder = async (
    folderId: string,
    newFolderName: string,
  ) => {
    try {
      await axios.patch(
        `http://localhost:5001/api/folder/rename/${folderId}`,
        { folderName: newFolderName },
        { withCredentials: true },
      );
      refreshFolders(currentFolderId);
    } catch (error) {
      console.error('Error renaming folder:', error);
    }
  };

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
          disabled={activeStartIndex === 0}
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
          {visibleFolders.map((folder) => (
            <Folder
              page={page}
              key={folder.id}
              id={folder.id}
              name={folder.name}
              owner={folder.owner}
              createdAt={folder.createdAt}
              parentFolder={folder.parentFolder}
              folderChildren={folder.folderChildren}
              fileChildren={folder.fileChildren}
              isFavorited={folder.isFavorited}
              onClick={() => onFolderClick(folder)}
              handleRenameFolder={handleRenameFolder}
              handleDeleteFolder={handleDeleteFolder}
              handleFavoriteFolder={() =>
                handleFavoriteFolder(folder.id, folder.owner)
              }
              handleRestoreFolder={() =>
                handleRestoreFolder(folder.id, folder.owner)
              }
            />
          ))}
        </Box>

        <Button
          className="right-button"
          onClick={handleNext}
          disabled={activeStartIndex + itemsPerPage >= filteredFolders.length}
        >
          <KeyboardArrowRight />
        </Button>
      </Box>

      <Box sx={{ px: 2, display: 'flex', justifyContent: 'center' }}>
        <Slider
          value={activeStartIndex}
          min={0}
          max={sliderMax}
          step={1}
          onChange={handleSliderChange}
          valueLabelDisplay="off"
          sx={{
            width: '200px',
            '& .MuiSlider-thumb': {
              width: 12,
              height: 12,
            },
            '& .MuiSlider-track': {
              height: 4,
            },
            '& .MuiSlider-rail': {
              height: 4,
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default FolderContainer;
