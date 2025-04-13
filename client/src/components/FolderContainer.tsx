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
  refreshFolders,
  searchQuery,
}) => {
  // Constants and refs
  const visibleItems = 6; // maximum folders visible without scrolling
  const folderWidth = 140; // each folder width (in pixels)
  const gap = 16; // gap between folders in pixels
  const containerRef = useRef<HTMLDivElement>(null);
  const slideWidth = folderWidth + gap; // total width taken by each folder

  // Animation and physics refs
  // No velocity and momentum for simplicity
  // const animationRef = useRef<number | undefined>(undefined);
  // const velocityRef = useRef(0);
  const lastMouseXRef = useRef(0);
  // const lastTimeRef = useRef(Date.now());
  const isTransitioningRef = useRef(false);
  const transformRef = useRef<HTMLDivElement>(null);

  // State variables
  const [wasDragging, setWasDragging] = useState(false);
  const [filteredFolders, setFilteredFolders] = useState<Folder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [currentTranslateX, setCurrentTranslateX] = useState(0);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [displayFolders, setDisplayFolders] = useState<Folder[]>([]);

  // Use a ref to always track the latest isDragging value.
  const isDraggingRef = useRef(isDragging);
  useEffect(() => {
    isDraggingRef.current = isDragging;
    console.log('[useEffect] isDragging changed to:', isDragging);
  }, [isDragging]);

  /**
   * Dynamically reorders the cloned sets to maintain infinite scrolling.
   *
   * If the user scrolls too far to the right (translateX > -totalSetWidth)
   * then move the left clone to the end and subtract one set width.
   *
   * If the user scrolls too far to the left (translateX < -(2 * totalSetWidth))
   * then move the right clone to the beginning and add one set width.
   */
  const reorderClones = useCallback(() => {
    console.log(
      '[reorderClones] Checking reorder conditions. translateX:',
      translateX,
    );
    if (!shouldScroll) {
      console.log('[reorderClones] shouldScroll is false. Exiting.');
      return;
    }
    const n = filteredFolders.length;
    if (n === 0) return;
    const totalSetWidth = n * slideWidth;
    let newTranslateX = translateX;
    let newDisplayFolders = displayFolders;
    let changed = false;

    // Condition for scrolling to the right.
    if (translateX > -totalSetWidth) {
      console.log(
        '[reorderClones] Right side condition met. translateX:',
        translateX,
      );
      newDisplayFolders = displayFolders
        .slice(0, n)
        .concat(displayFolders.slice(n));
      newTranslateX = translateX - totalSetWidth - slideWidth - gap / 4;
      changed = true;
    }
    // Condition for scrolling to the left.
    else if (translateX < -(2 * totalSetWidth)) {
      console.log(
        '[reorderClones] Left side condition met. translateX:',
        translateX,
      );
      newDisplayFolders = displayFolders
        .slice(-n)
        .concat(displayFolders.slice(0, -n));
      newTranslateX = translateX + totalSetWidth + slideWidth + gap / 4;
      changed = true;
    }

    if (changed) {
      console.log(
        '[reorderClones] Reordering clones. New translateX:',
        newTranslateX,
        'n:',
        n,
        'old translateX:',
        translateX,
      );
      setDisplayFolders(newDisplayFolders);
      setTranslateX(newTranslateX);
      setCurrentTranslateX(newTranslateX);
      if (transformRef.current) {
        transformRef.current.style.transition = 'none';
        transformRef.current.style.transform = `translate3d(${newTranslateX}px, 0, 0)`;
        void transformRef.current.offsetHeight;
        transformRef.current.style.transition = 'transform 0.2s ease-out';
      }
    } else {
      console.log('[reorderClones] No reordering needed.');
    }
  }, [translateX, displayFolders, filteredFolders, slideWidth, shouldScroll]);

  /**
   * Processes the folder data, applies filtering and sorting,
   * and sets up the initial array for infinite scrolling.
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

    // Sort folders using natural (numeric-aware) order.
    foldersArray.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }),
    );

    const updatedFilteredFolders = foldersArray.filter((folder) =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const canScroll = updatedFilteredFolders.length > visibleItems;
    console.log(
      '[useEffect] canScroll:',
      canScroll,
      'Filtered folders:',
      updatedFilteredFolders.length,
    );
    setShouldScroll(canScroll);

    // No momentum for simplicity
    /*
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    */
    // Reset velocity (if used in other parts)
    // velocityRef.current = 0;

    setFilteredFolders(updatedFilteredFolders);

    if (canScroll && updatedFilteredFolders.length > 0) {
      // Create three sets for infinite scroll.
      const display = [
        ...updatedFilteredFolders,
        ...updatedFilteredFolders,
        ...updatedFilteredFolders,
      ];
      setDisplayFolders(display);

      // Initially, position on the middle clone.
      const newPosition = -updatedFilteredFolders.length * slideWidth;
      console.log('[useEffect] Initializing infinite carousel', {
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
   * No Momentum for simplicity
   */
  /*
  const animate = useCallback(() => {
    console.log('[animate] Entering animate. isDragging (ref):', isDraggingRef.current);
    if (isDraggingRef.current) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    const now = Date.now();
    const dt = Math.min(now - lastTimeRef.current, 32);
    lastTimeRef.current = now;

    // Apply friction.
    velocityRef.current *= Math.pow(0.92, dt / 16);
    const maxVelocity = 20;
    velocityRef.current = Math.min(
      Math.max(velocityRef.current, -maxVelocity),
      maxVelocity,
    );

    console.log('[animate] translateX:', translateX, 'velocity:', velocityRef.current, 'dt:', dt);

    if (Math.abs(velocityRef.current) > 0.1) {
      const next = translateX + (velocityRef.current * dt) / 20;
      if (transformRef.current) {
        transformRef.current.style.transform = `translate3d(${next}px, 0, 0)`;
      }
      console.log('[animate] Momentum going.');
      setTranslateX(next);
      setCurrentTranslateX(next);
      animationRef.current = requestAnimationFrame(animate);
    } else {
      velocityRef.current = 0;
      console.log('[animate] Momentum stopped. Calling reorderClones.');
      reorderClones();
    }
  }, [translateX, reorderClones]);
  */

  /**
   * Handles drag/touch start events.
   */
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!shouldScroll) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      console.log('[handleDragStart] Drag started at clientX:', clientX);
      setIsDragging(true);
      setWasDragging(false);
      setDragStartX(clientX);
      setCurrentTranslateX(translateX);
      lastMouseXRef.current = clientX;
      // lastTimeRef.current = Date.now(); // Not used without momentum.
      // velocityRef.current = 0;
      // if (animationRef.current) {
      //   cancelAnimationFrame(animationRef.current);
      // }
    },
    [shouldScroll, translateX],
  );

  /**
   * Handles drag/touch move events.
   */
  const handleDragMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging || !shouldScroll) return;
      e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const diff = clientX - dragStartX;
      const next = currentTranslateX + diff * 0.8;
      console.log(
        '[handleDragMove] clientX:',
        clientX,
        'diff:',
        diff,
        'next translateX:',
        next,
      );
      if (transformRef.current) {
        transformRef.current.style.transform = `translate3d(${next}px, 0, 0)`;
      }
      setTranslateX(next);
      // Commenting out velocity/animation calculations.
      // const dt = Date.now() - lastTimeRef.current;
      // if (dt > 0) {
      //   velocityRef.current = ((clientX - lastMouseXRef.current) / dt) * 12;
      // }
      lastMouseXRef.current = clientX;
      // lastTimeRef.current = Date.now();
    },
    [isDragging, shouldScroll, dragStartX, currentTranslateX],
  );

  /**
   * Handles drag/touch end events.
   * For simplicity, we disable momentum here and simply call reorderClones.
   */
  const handleDragEnd = useCallback(() => {
    console.log(
      '[handleDragEnd] Entering handleDragEnd. isDragging:',
      isDragging,
    );
    if (!isDragging || !shouldScroll) return;
    const totalMovement = Math.abs(translateX - currentTranslateX);
    console.log('[handleDragEnd] Drag ended. Total movement:', totalMovement);

    setIsDragging(false);
    setWasDragging(totalMovement > 5);
    setCurrentTranslateX(translateX);

    // Call reorderClones unconditionally; it will check translateX internally.
    reorderClones();

    // No momentum or velovity for simplicity
    // If you wanted momentum, you'd call animationRef.current = requestAnimationFrame(animate);
    // setTimeout(() => {
    //   setWasDragging(false);
    // }, 50);
  }, [isDragging, shouldScroll, translateX, currentTranslateX, reorderClones]);

  /**
   * Swipe handlers from react-swipeable.
   */
  const swipeHandlers = useSwipeable({
    onSwiping: (e) => {
      if (!shouldScroll) return;
      const diff = e.deltaX;
      console.log('[swipeHandlers] Swiping. deltaX:', diff);
      setTranslateX((prev) => prev + diff * 0.8);
    },
    onSwipedLeft: () => {
      console.log('[swipeHandlers] Swiped left. Calling reorderClones.');
      reorderClones();
    },
    onSwipedRight: () => {
      console.log('[swipeHandlers] Swiped right. Calling reorderClones.');
      reorderClones();
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
    delta: 10,
    swipeDuration: 500,
  });

  // Remove onMouseLeave to avoid accidental re-triggering of drag.
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
              flexDirection: 'row',
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
