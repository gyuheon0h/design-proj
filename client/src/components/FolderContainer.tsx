import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Button, Grow, Slider } from '@mui/material';
import { useSwipeable } from 'react-swipeable';
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
  // const itemsPerPage = 5;

  // swipeable constants
  const visibleItems = 6;
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

  // const [activeStartIndex, setActiveStartIndex] = useState(0);
  // const [filteredFolders, setFilteredFolders] = useState<Folder[]>([]);
  // const [visibleFolders, setVisibleFolders] = useState<Folder[]>([]);
  // const [error, setError] = useState<string | null>(null);

  // Use a ref to always track the latest isDragging value.
  const isDraggingRef = useRef(isDragging);
  useEffect(() => {
    isDraggingRef.current = isDragging;
    console.log('[useEffect] isDragging changed to:', isDragging);
  }, [isDragging]);

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

    //TODO: ethan: idk if this is needed...
    // Sort folders using natural (numeric-aware) order.
    // foldersArray.sort((a, b) =>
    //   a.name.localeCompare(b.name, undefined, { numeric: true }),
    // );

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

  useEffect(() => {
    setWasDragging(false);
  }, [folders]);

  // useEffect(() => {
  //   setVisibleFolders(
  //     filteredFolders.slice(activeStartIndex, activeStartIndex + itemsPerPage),
  //   );
  // }, [filteredFolders, activeStartIndex, itemsPerPage]);

  // const sliderMax = Math.max(filteredFolders.length - itemsPerPage, 0);

  // const updateVisibleFolders = (newStartIndex: number) => {
  //   setActiveStartIndex(newStartIndex);
  //   setVisibleFolders(
  //     filteredFolders.slice(newStartIndex, newStartIndex + itemsPerPage),
  //   );
  // };

  // const handleNext = () => {
  //   if (activeStartIndex + itemsPerPage < filteredFolders.length) {
  //     updateVisibleFolders(activeStartIndex + 1);
  //   }
  // };

  // const handleBack = () => {
  //   if (activeStartIndex > 0) {
  //     updateVisibleFolders(activeStartIndex - 1);
  //   }
  // };

  // const handleSliderChange = (event: Event, newValue: number | number[]) => {
  //   if (typeof newValue === 'number') {
  //     updateVisibleFolders(newValue);
  //   }
  // };

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
