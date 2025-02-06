import React, { useState, useEffect } from 'react';
import { Box, Button, Slider } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import Folder, { FolderProp } from './Folder';
import FolderDialog from './CreateFolderDialog';
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
  const [activeStartIndex, setActiveStartIndex] = useState(0);
  const [visibleFolders, setVisibleFolders] = useState<FolderProp[]>([]);

  useEffect(() => {
    setVisibleFolders(
      folders.slice(activeStartIndex, activeStartIndex + itemsPerPage),
    );
  }, [folders, itemsPerPage, activeStartIndex]);

  const sliderMax = Math.max(folders.length - itemsPerPage, 0);

  const updateVisibleFolders = (newStartIndex: number) => {
    setActiveStartIndex(newStartIndex);
    setVisibleFolders(
      folders.slice(newStartIndex, newStartIndex + itemsPerPage),
    );
  };

  const handleNext = () => {
    if (activeStartIndex + itemsPerPage < folders.length) {
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
      const response = await axios.delete(
        `http://localhost:5001/api/folder/delete/${folderId}`,
        {
          withCredentials: true,
        },
      );

      refreshFolders(currentFolderId);
      return response.data;
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  //FOLDER FAVORITING HANDLER, favorites the folder given folderId
  const handleFavoriteFolder = async (folderId: string) => {
    try {
      const response = await axios.patch(
        `http://localhost:5001/api/folder/favorite/${folderId}`,
        { withCredentials: true },
      );

      refreshFolders(currentFolderId);
      return response.data;
    } catch (error) {
      console.error('Error favoriting folder:', error);
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
              onFolderDelete={handleDeleteFolder}
            />
          ))}
        </Box>

        <Button
          className="right-button"
          onClick={handleNext}
          disabled={activeStartIndex + itemsPerPage >= folders.length}
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
