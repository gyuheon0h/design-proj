import React, { useState } from 'react';
import Folder, { FolderProp } from '../components/Folder';
import { Box, Button, Slider } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';

interface FolderContainerProps {
  initialFolders: FolderProp[];
  itemsPerPage: number;
}

const FolderContainer: React.FC<FolderContainerProps> = ({
  initialFolders,
  itemsPerPage,
}) => {
  const initialVisibleFolders = initialFolders.slice(0, itemsPerPage);

  const [folders] = useState<FolderProp[]>(initialFolders);
  const [visibleFolders, setVisibleFolders] = useState<FolderProp[]>(
    initialVisibleFolders,
  );
  const [activeStartIndex, setActiveStartIndex] = useState(0);
  const [activeEndIndex, setActiveEndIndex] = useState(
    Math.min(itemsPerPage, initialFolders.length),
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

  return (
    <Box className="folder-container" sx={{ width: '100%' }}>
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
            <Folder key={folder.id} {...folder} />
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
    </Box>
  );
};

export default FolderContainer;
