import React, { useState, useEffect, useRef } from 'react';
import { Box, Button } from '@mui/material';
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

  const [activeIndex, setActiveIndex] = useState(1);
  const [filteredFolders, setFilteredFolders] = useState<FolderProps[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);

  const visibleFolders = 6;
  const folderWidth = 220; // Width of each folder card including margin

  useEffect(() => {
    // Filter folders based on search query
    const updatedFilteredFolders = folders.filter((folder) =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredFolders(updatedFilteredFolders);
    setActiveIndex(1); // Reset to the first visible index on search change
  }, [folders, searchQuery]);

  // Create looping effect by cloning first and last items
  const loopingFolders =
    filteredFolders.length > 0
      ? [
          filteredFolders[filteredFolders.length - 1], // Clone last item
          ...filteredFolders,
          filteredFolders[0], // Clone first item
        ]
      : [];

  const handleNext = () => {
    setActiveIndex((prevIndex) => prevIndex + 1);
  };

  const handlePrev = () => {
    setActiveIndex((prevIndex) => prevIndex - 1);
  };

  // Handle looping effect
  useEffect(() => {
    if (carouselRef.current) {
      if (activeIndex === loopingFolders.length - visibleFolders) {
        setTimeout(() => {
          carouselRef.current!.style.transition = 'none';
          setActiveIndex(1); // Jump to first visible item
        }, 300); // Match transition duration
      } else if (activeIndex === 0) {
        setTimeout(() => {
          carouselRef.current!.style.transition = 'none';
          setActiveIndex(loopingFolders.length - visibleFolders - 1); // Jump to last visible item
        }, 300);
      } else {
        carouselRef.current.style.transition = 'transform 0.3s ease';
      }
    }
  }, [activeIndex, loopingFolders.length]);

  // Update active index on manual scroll
  const handleScroll = () => {
    if (carouselRef.current) {
      const scrollLeft = carouselRef.current.scrollLeft;
      const newIndex = Math.round(scrollLeft / folderWidth);
      setActiveIndex(newIndex + 1);
    }
  };

  return (
    <Box
      className="folder-container"
      sx={{
        overflowX: 'auto',
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        display: 'flex',
        gap: '10px',
        position: 'relative',
        width: '100%',
        maxWidth: `${visibleFolders * folderWidth}px`,
        margin: '0 auto',
        '&::-webkit-scrollbar': {
          display: 'none', // Hide scrollbar for a cleaner look
        },
      }}
      ref={carouselRef}
      onScroll={handleScroll}
    >
      {/* Left Button */}
      <Button
        className="left-button"
        onClick={handlePrev}
        sx={{
          position: 'absolute',
          left: '-40px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2,
        }}
      >
        <KeyboardArrowLeft />
      </Button>

      {/* Carousel */}
      {loopingFolders.map((folder, index) =>
        folder && folder.id ? (
          <Box
            key={`${folder.id}-${index}`}
            sx={{
              minWidth: `${folderWidth}px`,
              scrollSnapAlign: 'start',
              boxSizing: 'border-box',
              flexShrink: 0,
              height: '300px', // Adjust the height here
            }}
          >
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
          </Box>
        ) : null,
      )}

      {/* Right Button */}
      <Button
        className="right-button"
        onClick={handleNext}
        sx={{
          position: 'absolute',
          right: '-40px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2,
        }}
      >
        <KeyboardArrowRight />
      </Button>
    </Box>
  );
};

export default FolderContainer;
