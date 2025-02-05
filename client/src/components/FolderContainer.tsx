import React, { useState } from 'react';
import { Box, Button, Slider } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import Folder, { FolderProp } from './Folder';
import FolderDialog from '../pages/CreateFolderDialog';
import { colors, typography } from '../Styles';
import axios from 'axios';

interface FolderContainerProps {
  folders: FolderProp[];
  onFolderClick: (folder: FolderProp) => void;
  currentFolderId: string | null;
  refreshFolders: (folderId: string | null) => void;
  itemsPerPage: number;
}

const FolderContainer: React.FC<FolderContainerProps> = ({
  folders,
  onFolderClick,
  currentFolderId,
  refreshFolders,
  itemsPerPage,
}) => {
  const [open, setOpen] = useState(false);
  const [activeStartIndex, setActiveStartIndex] = useState(0);
  const [activeEndIndex, setActiveEndIndex] = useState(
    Math.min(itemsPerPage, folders.length),
  );
  const [visibleFolders, setVisibleFolders] = useState(
    folders.slice(0, itemsPerPage),
  );

  const sliderMax = Math.max(folders.length - itemsPerPage, 0);

  const updateVisibleFolders = (newStartIndex: number) => {
    const newEndIndex = newStartIndex + itemsPerPage;
    setActiveStartIndex(newStartIndex);
    setActiveEndIndex(newEndIndex);
    setVisibleFolders(folders.slice(newStartIndex, newEndIndex));
  };

  const handleNext = () => {
    if (activeEndIndex < folders.length) {
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

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleCreateFolder = async (
    folderName: string,
    parentFolder: string | null,
  ) => {
    const requestBody = { name: folderName, parentFolder };
    try {
      const response = await axios.post(
        'http://localhost:5001/api/folder/create',
        requestBody,
        { withCredentials: true },
      );
      refreshFolders(currentFolderId);
      return response.data;
    } catch (error) {
      console.error('Folder creation failed:', error);
      throw error;
    }
  };

  return (
    <Box className="folder-container" sx={{ width: '100%' }}>
      {/* Header section with title and create button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '15px',
        }}
      >
        <h2>Folders</h2>
        <Button
          variant="contained"
          onClick={handleOpen}
          sx={{
            backgroundColor: colors.lightBlue,
            color: colors.darkBlue,
            fontFamily: typography.fontFamily,
            fontSize: typography.fontSize.medium,
            fontWeight: 'bold',
            marginLeft: '15px',
            '&:hover': {
              backgroundColor: colors.darkBlue,
              color: colors.white,
            },
          }}
        >
          + Create Folder
        </Button>
      </Box>

      {/* Main container for arrow buttons and visible folders */}
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
              key={folder.id}
              {...folder}
              onClick={() => onFolderClick(folder)}
            />
          ))}
        </Box>

        <Button
          className="right-button"
          onClick={handleNext}
          disabled={activeEndIndex >= folders.length}
        >
          <KeyboardArrowRight />
        </Button>
      </Box>

      {/* Slider to navigate through the folders */}
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

      {/* Dialog */}
      <FolderDialog
        open={open}
        onClose={handleClose}
        currentFolderId={currentFolderId}
        onFolderCreate={handleCreateFolder}
      />
    </Box>
  );
};

export default FolderContainer;
