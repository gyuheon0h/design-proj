import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box } from '@mui/material';
import ErrorAlert from '../components/ErrorAlert';
import { useSwipeable } from 'react-swipeable';
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
  const cloneCount = Math.max(visibleItems, 3); // Base clone count
  const animationRef = useRef<number | undefined>(undefined);
  const velocityRef = useRef(0);
  const lastMouseXRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const isTransitioningRef = useRef(false);
  const [wasDragging, setWasDragging] = useState(false);

  const [filteredFolders, setFilteredFolders] = useState<Folder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [translateX, setTranslateX] = useState(-slideWidth * cloneCount * 2);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [currentTranslateX, setCurrentTranslateX] = useState(
    -slideWidth * cloneCount * 2,
  );
  const [extendedFolders, setExtendedFolders] = useState<Folder[]>([]);
  const [shouldScroll, setShouldScroll] = useState(false);
  const transformRef = useRef<HTMLDivElement>(null);

  const resetPosition = useCallback((position: number) => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    const container = containerRef.current?.querySelector(
      '.sliding-container',
    ) as HTMLElement;
    if (container) {
      container.style.transition = 'none';
      container.style.transform = `translate3d(${position}px, 0, 0)`;
      // Force reflow
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = container.offsetHeight;
      container.style.transition = 'transform 0.2s ease-out';
    }

    setTranslateX(position);
    setCurrentTranslateX(position);

    // Use a shorter delay for better responsiveness
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 200);
  }, []);

  const checkBounds = useCallback(() => {
    if (isTransitioningRef.current || !shouldScroll) return;

    const originalLength = Math.ceil(filteredFolders.length / 3);
    const currentIndex = Math.round(Math.abs(translateX / slideWidth));
    const totalSets = Math.floor(filteredFolders.length / originalLength);

    // Calculate the current set we're in
    const currentSet = Math.floor(currentIndex / originalLength);

    // If we're approaching the edges, add more clones
    if (currentSet <= 1 || currentSet >= totalSets - 2) {
      const newPreClone = [...extendedFolders.slice(0, originalLength)];
      const newPostClone = [...extendedFolders.slice(-originalLength)];

      const newFolders = [...newPreClone, ...extendedFolders, ...newPostClone];
      setFilteredFolders(newFolders);

      // Adjust position to account for new clones
      const positionAdjustment =
        currentSet <= 1 ? originalLength * slideWidth : 0;
      const newPosition = translateX + positionAdjustment;

      resetPosition(newPosition);
      return;
    }

    // Normal position reset when not adding new clones
    if (currentIndex < originalLength) {
      const newPosition = translateX - originalLength * slideWidth;
      resetPosition(newPosition);
      velocityRef.current = 0;
    } else if (currentIndex >= filteredFolders.length - originalLength) {
      const newPosition = translateX + originalLength * slideWidth;
      resetPosition(newPosition);
      velocityRef.current = 0;
    }
  }, [
    extendedFolders,
    filteredFolders.length,
    resetPosition,
    shouldScroll,
    slideWidth,
    translateX,
  ]);

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

    // Only enable scrolling if we have more folders than visible items
    const canScroll = updatedFilteredFolders.length > visibleItems;
    setShouldScroll(canScroll);

    // Immediately cancel any ongoing animations
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    velocityRef.current = 0;

    const getExtendedFolders = (folders: Folder[]) => {
      if (folders.length === 0) return [];
      if (!canScroll) return folders;

      // Reduce clone count to just what's needed for smooth scrolling
      const baseCloneCount = Math.min(
        Math.max(visibleItems, 2), // Minimum 2 sets of clones
        Math.ceil(folders.length / 2), // Maximum half the folder count
      );

      // Create clones more efficiently
      const preClone = Array(baseCloneCount)
        .fill(null)
        .flatMap(() => [...folders]);
      const postClone = Array(baseCloneCount)
        .fill(null)
        .flatMap(() => [...folders]);

      return [...preClone, ...folders, ...postClone];
    };

    // Create new extended folders
    const newExtendedFolders = getExtendedFolders(updatedFilteredFolders);

    // Calculate new position
    const newPosition = canScroll
      ? -slideWidth * (updatedFilteredFolders.length * Math.floor(cloneCount))
      : 0;

    // Batch all state updates together
    requestAnimationFrame(() => {
      setExtendedFolders(newExtendedFolders);
      setFilteredFolders(newExtendedFolders);
      setTranslateX(newPosition);
      setCurrentTranslateX(newPosition);

      // Update DOM in a single frame
      if (transformRef.current) {
        transformRef.current.style.transition = 'none';
        transformRef.current.style.transform = `translate3d(${newPosition}px, 0, 0)`;
        // Force reflow more efficiently
        void transformRef.current.offsetHeight;
        transformRef.current.style.transition = 'transform 0.2s ease-out';
      }

      // Reset transition state
      isTransitioningRef.current = false;
    });
  }, [folders, searchQuery, slideWidth, cloneCount, visibleItems]);

  const animate = useCallback(() => {
    if (isDragging) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const now = Date.now();
    const dt = Math.min(now - lastTimeRef.current, 32); // Cap at ~30fps to prevent large jumps
    lastTimeRef.current = now;

    // Increase friction slightly for slower deceleration
    velocityRef.current *= Math.pow(0.92, dt / 16);

    // Reduce max velocity for slower scrolling
    const maxVelocity = 20;
    velocityRef.current = Math.min(
      Math.max(velocityRef.current, -maxVelocity),
      maxVelocity,
    );

    if (Math.abs(velocityRef.current) > 0.1) {
      // Reduce velocity multiplier for slower movement
      const next = translateX + (velocityRef.current * dt) / 20;
      if (transformRef.current) {
        transformRef.current.style.transform = `translate3d(${next}px, 0, 0)`;
        setTranslateX(next);
      }
      checkBounds();
      animationRef.current = requestAnimationFrame(animate);
    } else {
      velocityRef.current = 0;
      checkBounds();
    }
  }, [isDragging, translateX, checkBounds]);

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!shouldScroll) return;

      setIsDragging(true);
      setWasDragging(false);
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      setDragStartX(clientX);
      setCurrentTranslateX(translateX);
      lastMouseXRef.current = clientX;
      lastTimeRef.current = Date.now();
      velocityRef.current = 0;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    },
    [shouldScroll, translateX],
  );

  const handleDragMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging || !shouldScroll) return;
      e.preventDefault();

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const diff = clientX - dragStartX;
      // Reduce drag sensitivity
      const next = currentTranslateX + diff * 0.8;

      // Update transform directly for smoother dragging
      if (transformRef.current) {
        transformRef.current.style.transform = `translate3d(${next}px, 0, 0)`;
      }

      // Throttle state updates during drag
      const now = Date.now();
      if (now - lastTimeRef.current > 16) {
        // ~60fps
        lastTimeRef.current = now;
        setTranslateX(next);
      }

      // Calculate velocity with reduced sensitivity
      const dt = now - lastTimeRef.current;
      if (dt > 0) {
        velocityRef.current = ((clientX - lastMouseXRef.current) / dt) * 12;
      }

      lastMouseXRef.current = clientX;
    },
    [isDragging, shouldScroll, dragStartX, currentTranslateX],
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging || !shouldScroll) return;
    setIsDragging(false);

    // Calculate total movement
    const totalMovement = Math.abs(translateX - currentTranslateX);
    // Only set wasDragging if moved more than 5px to allow for clicks
    setWasDragging(totalMovement > 5);

    setCurrentTranslateX(translateX);

    // Start deceleration animation
    animationRef.current = requestAnimationFrame(animate);

    // Reset wasDragging after a shorter delay
    setTimeout(() => {
      setWasDragging(false);
    }, 50);
  }, [isDragging, shouldScroll, translateX, animate, currentTranslateX]);

  const swipeHandlers = useSwipeable({
    onSwiping: (e) => {
      if (!shouldScroll) return;
      const diff = e.deltaX;
      setTranslateX((prev) => prev + diff * 0.8); // Added multiplier to match other scroll speeds
    },
    onSwipedLeft: () => checkBounds(),
    onSwipedRight: () => checkBounds(),
    trackMouse: true,
    preventScrollOnSwipe: true,
    delta: 10,
    swipeDuration: 500,
  });

  // Add effect to handle folder updates
  useEffect(() => {
    // Reset wasDragging when folders change to ensure clicks work
    setWasDragging(false);
  }, [folders]);

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
        {...(shouldScroll ? swipeHandlers : {})}
        ref={containerRef}
        onMouseDown={shouldScroll ? handleDragStart : undefined}
        onMouseMove={shouldScroll ? handleDragMove : undefined}
        onMouseUp={shouldScroll ? handleDragEnd : undefined}
        onMouseLeave={shouldScroll ? handleDragEnd : undefined}
        onTouchStart={shouldScroll ? handleDragStart : undefined}
        onTouchMove={shouldScroll ? handleDragMove : undefined}
        onTouchEnd={shouldScroll ? handleDragEnd : undefined}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          position: 'relative',
          cursor: shouldScroll ? (isDragging ? 'grabbing' : 'grab') : 'default',
        }}
      >
        <Box
          className="visible-folders"
          sx={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
            willChange: 'transform',
          }}
        >
          <Box
            className="sliding-container"
            ref={transformRef}
            sx={{
              display: 'flex',
              position: 'relative',
              gap: 2,
              transform: shouldScroll
                ? `translate3d(${translateX}px, 0, 0)`
                : undefined,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              userSelect: 'none',
              width: 'fit-content',
              px: 1,
              justifyContent: !shouldScroll ? 'flex-start' : undefined,
              willChange: 'transform',
              backfaceVisibility: 'hidden',
            }}
          >
            {filteredFolders.map((folder, index) => (
              <Box
                key={`${folder.id}-${searchQuery}-${index}`}
                sx={{
                  width: folderWidth,
                  flexShrink: 0,
                  marginRight:
                    index < filteredFolders.length - 1 ? `${gap}px` : 0,
                  pointerEvents: 'auto',
                }}
              >
                <FolderComponent
                  page={page}
                  folder={folder}
                  onClick={() => {
                    if (!isDragging && !wasDragging) {
                      onFolderClick(folder);
                    }
                  }}
                  refreshFolders={refreshFolders}
                />
              </Box>
            ))}
          </Box>
        </Box>
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
