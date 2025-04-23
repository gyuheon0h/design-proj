import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, IconButton } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { useSwipeable } from 'react-swipeable';
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
  refreshFolders,
  searchQuery,
}) => {
  const visibleItems = 6;
  const folderWidth = 140;
  const gap = 16;
  const slideWidth = folderWidth + gap;

  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<HTMLDivElement>(null);

  const [filteredFolders, setFilteredFolders] = useState<Folder[]>([]);
  const [translateX, setTranslateX] = useState(0);
  const [currentTranslateX, setCurrentTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate scroll bounds
  const maxTranslateX = 0;
  const minTranslateX = -Math.max(
    (filteredFolders.length - visibleItems) * slideWidth,
    0,
  );

  // Filter and reset scroll on change
  useEffect(() => {
    let foldersArray: Folder[] = Array.isArray(folders)
      ? folders
      : (folders as any).folders || [];

    const updated = foldersArray.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    setFilteredFolders(updated);
    setShouldScroll(updated.length > visibleItems);

    // Reset positions
    setTranslateX(0);
    setCurrentTranslateX(0);
    if (transformRef.current) {
      transformRef.current.style.transition = 'none';
      transformRef.current.style.transform = 'translate3d(0,0,0)';
      void transformRef.current.offsetHeight;
      transformRef.current.style.transition = 'transform 0.2s ease-out';
    }
  }, [folders, searchQuery, visibleItems, slideWidth]);

  // Handle drag start
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!shouldScroll) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      setIsDragging(true);
      setDragStartX(clientX);
      setCurrentTranslateX(translateX);
    },
    [shouldScroll, translateX],
  );

  // Handle drag move with bounds clamping
  const handleDragMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging || !shouldScroll) return;
      e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const diff = clientX - dragStartX;
      const rawNext = currentTranslateX + diff;
      const next = Math.min(maxTranslateX, Math.max(minTranslateX, rawNext));

      if (transformRef.current) {
        transformRef.current.style.transform = `translate3d(${next}px,0,0)`;
      }
      setTranslateX(next);
    },
    [
      isDragging,
      shouldScroll,
      dragStartX,
      currentTranslateX,
      minTranslateX,
      maxTranslateX,
    ],
  );

  // Handle drag end: ensure final position is within bounds
  const handleDragEnd = useCallback(() => {
    if (!isDragging || !shouldScroll) return;
    setIsDragging(false);
    const clamped = Math.min(
      maxTranslateX,
      Math.max(minTranslateX, translateX),
    );
    setTranslateX(clamped);
    setCurrentTranslateX(clamped);
    if (transformRef.current) {
      transformRef.current.style.transition = 'transform 0.2s ease-out';
      transformRef.current.style.transform = `translate3d(${clamped}px,0,0)`;
    }
  }, [isDragging, shouldScroll, translateX, minTranslateX, maxTranslateX]);

  // Arrow click scrolling
  const scrollBy = (delta: number) => {
    setTranslateX((prev) => {
      const next = Math.min(
        maxTranslateX,
        Math.max(minTranslateX, prev + delta),
      );
      if (transformRef.current) {
        transformRef.current.style.transition = 'transform 0.2s ease-out';
        transformRef.current.style.transform = `translate3d(${next}px,0,0)`;
      }
      setCurrentTranslateX(next);
      return next;
    });
  };
  const handlePrev = () => scrollBy(slideWidth);
  const handleNext = () => scrollBy(-slideWidth);

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrev,
    trackMouse: true,
    preventScrollOnSwipe: true,
    delta: 10,
  });

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <h2>Folders</h2>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton
          onClick={handlePrev}
          disabled={!shouldScroll || translateX >= maxTranslateX}
          sx={{ zIndex: 2 }}
        >
          <KeyboardArrowLeft />
        </IconButton>

        <Box
          {...(shouldScroll ? swipeHandlers : {})}
          ref={containerRef}
          onMouseDown={shouldScroll ? handleDragStart : undefined}
          onMouseMove={shouldScroll ? handleDragMove : undefined}
          onMouseUp={shouldScroll ? handleDragEnd : undefined}
          onMouseLeave={shouldScroll && isDragging ? handleDragEnd : undefined}
          onTouchStart={shouldScroll ? handleDragStart : undefined}
          onTouchMove={shouldScroll ? handleDragMove : undefined}
          onTouchEnd={shouldScroll ? handleDragEnd : undefined}
          sx={{
            flex: 1,
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, black 1%, black 99%, transparent 100%)',
            maskImage:
              'linear-gradient(to right, transparent 0%, black 1%, black 99%, transparent 100%)',
            overflow: 'hidden',
            position: 'relative',
            cursor: shouldScroll
              ? isDragging
                ? 'grabbing'
                : 'grab'
              : 'default',
          }}
        >
          <Box
            ref={transformRef}
            sx={{
              display: 'flex',
              gap: `${gap}px`,
              transform: `translate3d(${translateX}px,0,0)`,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              userSelect: 'none',
            }}
          >
            {filteredFolders.map((folder) => (
              <Box
                key={folder.id}
                sx={{
                  width: folderWidth,
                  flexShrink: 0,
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    zIndex: 3,
                  },
                }}
              >
                <FolderComponent
                  page={page}
                  folder={folder}
                  onClick={() => {
                    if (!isDragging) onFolderClick(folder);
                  }}
                  refreshFolders={refreshFolders}
                />
              </Box>
            ))}
          </Box>
        </Box>

        <IconButton
          onClick={handleNext}
          disabled={!shouldScroll || translateX <= minTranslateX}
          sx={{ zIndex: 2 }}
        >
          <KeyboardArrowRight />
        </IconButton>
      </Box>

      {error && (
        <ErrorAlert open message={error} onClose={() => setError(null)} />
      )}
    </Box>
  );
};

export default FolderContainer;
