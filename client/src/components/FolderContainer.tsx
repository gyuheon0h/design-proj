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

    const getExtendedFolders = (folders: Folder[]) => {
      if (folders.length === 0) return [];
      if (!canScroll) return folders;

      // Create initial set of clones - use a larger number for smoother infinite scrolling
      const baseCloneCount = Math.max(
        cloneCount * 2,
        Math.ceil(folders.length),
      );
      const preClone = [];
      const postClone = [];

      // Create multiple sets of clones for smoother infinite scrolling
      for (let i = 0; i < baseCloneCount; i++) {
        preClone.unshift(...folders);
        postClone.push(...folders);
      }

      const extended = [...preClone, ...folders, ...postClone];
      setExtendedFolders(extended);
      return extended;
    };

    const extendedFolders = getExtendedFolders(updatedFilteredFolders);
    setFilteredFolders(extendedFolders);

    // Set initial position
    if (canScroll) {
      const initialPosition =
        -slideWidth * (updatedFilteredFolders.length * Math.floor(cloneCount));
      setTranslateX(initialPosition);
      setCurrentTranslateX(initialPosition);
    } else {
      setTranslateX(0);
      setCurrentTranslateX(0);
    }
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
    setWasDragging(true);
    setCurrentTranslateX(translateX);

    // Start deceleration animation
    animationRef.current = requestAnimationFrame(animate);

    // Reset wasDragging after a short delay
    setTimeout(() => {
      setWasDragging(false);
    }, 100);
  }, [isDragging, shouldScroll, translateX, animate]);

  const swipeHandlers = useSwipeable({
    onSwiping: (e) => {
      if (!shouldScroll) return;
      const diff = e.deltaX;
      setTranslateX((prev) => prev + diff);
    },
    onSwipedLeft: () => checkBounds(),
    onSwipedRight: () => checkBounds(),
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
            willChange: 'transform', // Hint to browser to optimize
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
                }}
              >
                <FolderComponent
                  page={page}
                  folder={folder}
                  onClick={() => {
                    if (!wasDragging) {
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
