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
  // ====== CONSTANTS AND REFS ======
  const visibleItems = 5; // Maximum number of folders visible without scrolling
  const folderWidth = 140; // Folder width (in pixels)
  const gap = 16; // Gap between folders (in pixels)
  const containerRef = useRef<HTMLDivElement>(null);
  const slideWidth = folderWidth + gap; // Total width per folder item

  // Animation and physics refs
  const animationRef = useRef<number | undefined>(undefined);
  const velocityRef = useRef(0);
  const lastMouseXRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const isTransitioningRef = useRef(false);
  const transformRef = useRef<HTMLDivElement>(null);

  // ====== STATE VARIABLES ======
  const [wasDragging, setWasDragging] = useState(false);
  const [filteredFolders, setFilteredFolders] = useState<Folder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [currentTranslateX, setCurrentTranslateX] = useState(0);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [displayFolders, setDisplayFolders] = useState<Folder[]>([]);

  /**
   * Resets the scroll position.
   * If instant is false, this update animates smoothly.
   */
  const resetPosition = useCallback(
    (position: number, instant = true) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      console.log('Resetting position', {
        from: translateX,
        to: position,
        instant,
      });

      if (transformRef.current) {
        if (instant) {
          // Disable transitions and jump instantly.
          transformRef.current.style.transition = 'none';
          transformRef.current.style.transform = `translate3d(${position}px, 0, 0)`;
          void transformRef.current.offsetHeight; // force reflow

          setTranslateX(position);
          setCurrentTranslateX(position);

          // Re-enable transition after a minimal delay.
          setTimeout(() => {
            if (transformRef.current) {
              transformRef.current.style.transition = 'transform 0.2s ease-out';
            }
            isTransitioningRef.current = false;
          }, 0);
        } else {
          // Use smooth animation.
          transformRef.current.style.transition = 'transform 0.2s ease-out';
          transformRef.current.style.transform = `translate3d(${position}px, 0, 0)`;

          setTranslateX(position);
          setCurrentTranslateX(position);

          setTimeout(() => {
            isTransitioningRef.current = false;
          }, 200);
        }
      }
    },
    [translateX],
  );

  /**
   * Checks boundaries and, if needed, resets the position with smooth animation.
   * Note: This function does nothing while the user is actively dragging.
   */
  const checkBounds = useCallback(() => {
    if (isTransitioningRef.current || !shouldScroll || isDragging) return;
    if (filteredFolders.length <= visibleItems) return;

    const buffer = 10; // A 10px buffer
    const originalFoldersWidth = filteredFolders.length * slideWidth;

    // If the user has scrolled too far right (i.e. translateX > buffer)
    if (translateX > buffer) {
      // Animate the reset smoothly.
      resetPosition(translateX - originalFoldersWidth, false);
      return;
    }

    // If the user has scrolled too far left
    if (translateX < -originalFoldersWidth - buffer) {
      resetPosition(translateX + originalFoldersWidth, false);
      return;
    }
  }, [
    isDragging,
    filteredFolders.length,
    resetPosition,
    shouldScroll,
    slideWidth,
    translateX,
    visibleItems,
  ]);

  /**
   * Processes folders, sets up infinite scroll if needed,
   * and initializes the container’s position.
   */
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

    // Sort folders using natural (numeric) order.
    foldersArray.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }),
    );

    const updatedFilteredFolders = foldersArray.filter((folder) =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const canScroll = updatedFilteredFolders.length > visibleItems;
    setShouldScroll(canScroll);

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    velocityRef.current = 0;

    setFilteredFolders(updatedFilteredFolders);

    if (canScroll && updatedFilteredFolders.length > 0) {
      // Create three copies for the infinite scroll effect.
      const display = [
        ...updatedFilteredFolders,
        ...updatedFilteredFolders,
        ...updatedFilteredFolders,
      ];
      setDisplayFolders(display);

      // Position the view to start at the middle set.
      const newPosition = -updatedFilteredFolders.length * slideWidth;

      console.log('Initializing infinite carousel', {
        count: updatedFilteredFolders.length,
        displayCount: display.length,
        position: newPosition,
      });

      setTranslateX(newPosition);
      setCurrentTranslateX(newPosition);

      if (transformRef.current) {
        transformRef.current.style.transition = 'none';
        transformRef.current.style.transform = `translate3d(${newPosition}px, 0, 0)`;
        void transformRef.current.offsetHeight;
        transformRef.current.style.transition = 'transform 0.2s ease-out';
      }
    } else {
      // Not enough folders to need scrolling.
      setDisplayFolders(updatedFilteredFolders);
      setTranslateX(0);
      setCurrentTranslateX(0);

      if (transformRef.current) {
        transformRef.current.style.transition = 'none';
        transformRef.current.style.transform = 'translate3d(0px, 0, 0)';
        void transformRef.current.offsetHeight;
        transformRef.current.style.transition = 'transform 0.2s ease-out';
      }
    }

    isTransitioningRef.current = false;
  }, [folders, searchQuery, slideWidth, visibleItems]);

  /**
   * Runs the momentum animation after drag ends.
   */
  const animate = useCallback(() => {
    if (isDragging) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const now = Date.now();
    const dt = Math.min(now - lastTimeRef.current, 32);
    lastTimeRef.current = now;

    velocityRef.current *= Math.pow(0.92, dt / 16);
    const maxVelocity = 20;
    velocityRef.current = Math.min(
      Math.max(velocityRef.current, -maxVelocity),
      maxVelocity,
    );

    if (Math.abs(velocityRef.current) > 0.1) {
      const next = translateX + (velocityRef.current * dt) / 20;
      if (transformRef.current) {
        transformRef.current.style.transform = `translate3d(${next}px, 0, 0)`;
        setTranslateX(next);
      }
      // Check bounds during momentum if not dragging.
      checkBounds();
      animationRef.current = requestAnimationFrame(animate);
    } else {
      velocityRef.current = 0;
      checkBounds();
    }
  }, [isDragging, translateX, checkBounds]);

  /**
   * Handles drag/touch start.
   */
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

  /**
   * Handles drag/touch movement.
   * Note: We no longer invoke checkBounds here, so the reset won’t occur mid-drag.
   */
  const handleDragMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging || !shouldScroll) return;
      e.preventDefault();

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const diff = clientX - dragStartX;
      const next = currentTranslateX + diff * 0.8;

      if (transformRef.current) {
        transformRef.current.style.transform = `translate3d(${next}px, 0, 0)`;
      }
      setTranslateX(next);

      // We do not call checkBounds here to avoid mid-drag jumps.
      const dt = Date.now() - lastTimeRef.current;
      if (dt > 0) {
        velocityRef.current = ((clientX - lastMouseXRef.current) / dt) * 12;
      }
      lastMouseXRef.current = clientX;
      lastTimeRef.current = Date.now();
    },
    [isDragging, shouldScroll, dragStartX, currentTranslateX],
  );

  /**
   * Handles the end of a drag/touch event.
   * On drag end, we trigger momentum animation and then check boundaries.
   */
  const handleDragEnd = useCallback(() => {
    if (!isDragging || !shouldScroll) return;
    setIsDragging(false);

    const totalMovement = Math.abs(translateX - currentTranslateX);
    setWasDragging(totalMovement > 5);
    setCurrentTranslateX(translateX);

    // Start momentum animation.
    animationRef.current = requestAnimationFrame(animate);

    // Immediately check bounds (will animate into place smoothly if needed).
    checkBounds();

    setTimeout(() => {
      setWasDragging(false);
    }, 50);
  }, [
    isDragging,
    shouldScroll,
    translateX,
    animate,
    currentTranslateX,
    checkBounds,
  ]);

  /**
   * Swipe handlers via react-swipeable.
   */
  const swipeHandlers = useSwipeable({
    onSwiping: (e) => {
      if (!shouldScroll) return;
      const diff = e.deltaX;
      setTranslateX((prev) => prev + diff * 0.8);
    },
    onSwipedLeft: checkBounds,
    onSwipedRight: checkBounds,
    trackMouse: true,
    preventScrollOnSwipe: true,
    delta: 10,
    swipeDuration: 500,
  });

  useEffect(() => {
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
            {displayFolders.map((folder, index) => (
              <Box
                key={`${folder.id}-${searchQuery}-${index}`}
                sx={{
                  width: folderWidth,
                  flexShrink: 0,
                  marginRight:
                    index < displayFolders.length - 1 ? `${gap}px` : 0,
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
