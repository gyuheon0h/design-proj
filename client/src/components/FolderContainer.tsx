import React, { useState, useEffect } from 'react';
import { Box, Button, Grow, Slider } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import ErrorAlert from '../components/ErrorAlert';
// import Folder, { FolderProps } from './Folder';
import { Folder } from '../interfaces/Folder';
import FolderComponent from './Folder';

interface FolderContainerProps {
  page: 'home' | 'shared' | 'favorites' | 'trash';
  folders: Folder[];
  onFolderClick: (folder: Folder) => void;
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
  const [filteredFolders, setFilteredFolders] = useState<Folder[]>([]);
  const [visibleFolders, setVisibleFolders] = useState<Folder[]>([]);
  const [error, setError] = useState<string | null>(null);

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
            <Grow in={true} timeout={500} key={`${folder.id}-${searchQuery}`}>
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
