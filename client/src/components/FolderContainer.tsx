import React, { useState, useEffect, useRef } from 'react';
import { Box, Button } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import ErrorAlert from '../components/ErrorAlert';
import { useSwipeable } from 'react-swipeable';
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
  const visibleItems = 5; // Number of items visible at once
  const folderWidth = 140; // Width of each folder including margin
  const gap = 16; // Gap between folders
  const containerRef = useRef<HTMLDivElement>(null);
  const slideWidth = folderWidth + gap; // Width of one slide movement
  const cloneCount = visibleItems; // Increase clone count to handle more edge cases

  const [filteredFolders, setFilteredFolders] = useState<Folder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [translateX, setTranslateX] = useState(-slideWidth * cloneCount);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [currentTranslateX, setCurrentTranslateX] = useState(
    -slideWidth * cloneCount,
  );
  const [skipTransition, setSkipTransition] = useState(false);

  // Move getExtendedFolders inside useEffect to avoid dependency issues
  useEffect(() => {
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

    // Create extended folders array with clones
    const getExtendedFolders = (folders: Folder[]) => {
      if (folders.length === 0) return [];
      const preClone = [...folders.slice(-cloneCount)];
      const postClone = [...folders.slice(0, cloneCount)];
      return [...preClone, ...folders, ...postClone];
    };

    setFilteredFolders(getExtendedFolders(updatedFilteredFolders));
    setTranslateX(-slideWidth * cloneCount);
    setCurrentTranslateX(-slideWidth * cloneCount);
  }, [folders, searchQuery, slideWidth, cloneCount]);

  const handleTransitionEnd = () => {
    if (!isTransitioning) return;

    const totalFolders = filteredFolders.length - 2 * cloneCount;
    const currentIndex = Math.round(Math.abs(translateX / slideWidth));

    if (currentIndex < cloneCount) {
      // Going backwards past the start
      setSkipTransition(true);
      const newTranslate = -slideWidth * (totalFolders + currentIndex);
      setTranslateX(newTranslate);
      setCurrentTranslateX(newTranslate);
    } else if (currentIndex >= totalFolders + cloneCount) {
      // Going forwards past the end
      setSkipTransition(true);
      const newTranslate = -slideWidth * (currentIndex - totalFolders);
      setTranslateX(newTranslate);
      setCurrentTranslateX(newTranslate);
    }

    setIsTransitioning(false);
  };

  const handleNext = () => {
    if (!isTransitioning) {
      setSkipTransition(false);
      setIsTransitioning(true);
      const nextTranslate = translateX - slideWidth;
      setTranslateX(nextTranslate);
      setCurrentTranslateX(nextTranslate);
    }
  };

  const handleBack = () => {
    if (!isTransitioning) {
      setSkipTransition(false);
      setIsTransitioning(true);
      const nextTranslate = translateX + slideWidth;
      setTranslateX(nextTranslate);
      setCurrentTranslateX(nextTranslate);
    }
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
    setCurrentTranslateX(translateX);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const diff = clientX - dragStartX;
    setTranslateX(currentTranslateX + diff);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const snapPoint = Math.round(translateX / slideWidth) * slideWidth;
    setIsTransitioning(true);
    setTranslateX(snapPoint);
    setCurrentTranslateX(snapPoint);
  };

  const swipeHandlers = useSwipeable({
    onSwiping: (e) => {
      if (isTransitioning) return;
      const diff = e.deltaX;
      setTranslateX(translateX + diff);
    },
    onSwipedLeft: () => {
      if (!isTransitioning) handleNext();
    },
    onSwipedRight: () => {
      if (!isTransitioning) handleBack();
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
    delta: 10,
    swipeDuration: 500,
  });

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
        {...swipeHandlers}
        ref={containerRef}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          position: 'relative',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <Button
          className="left-button"
          onClick={handleBack}
          disabled={isTransitioning}
          sx={{
            zIndex: 2,
            position: 'absolute',
            left: 0,
          }}
        >
          <KeyboardArrowLeft />
        </Button>

        <Box
          className="visible-folders"
          sx={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
            mx: 6,
          }}
        >
          <Box
            className="sliding-container"
            sx={{
              display: 'flex',
              position: 'relative',
              gap: 2,
              transform: `translateX(${translateX}px)`,
              transition:
                isDragging || skipTransition
                  ? 'none'
                  : 'transform 0.3s ease-out',
              userSelect: 'none',
              width: 'fit-content',
              px: 1,
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {filteredFolders.map((folder, index) => (
              <Box
                key={`${folder.id}-${searchQuery}-${index}`}
                sx={{
                  width: folderWidth,
                  flexShrink: 0,
                }}
              >
                <FolderComponent
                  page={page}
                  folder={folder}
                  onClick={() => onFolderClick(folder)}
                  refreshFolders={refreshFolders}
                />
              </Box>
            ))}
          </Box>
        </Box>

        <Button
          className="right-button"
          onClick={handleNext}
          disabled={isTransitioning}
          sx={{
            zIndex: 2,
            position: 'absolute',
            right: 0,
          }}
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
