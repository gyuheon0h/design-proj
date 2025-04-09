import React, { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Typography,
  TextField,
  Box,
  Divider,
  ListItemIcon,
  Paper,
  Breadcrumbs,
  Link,
  alpha,
  Tooltip,
} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIos';
import FolderIcon from '@mui/icons-material/Folder';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import ErrorAlert from '../components/ErrorAlert';
import { Folder } from '../interfaces/Folder';

interface MoveDialogProps {
  open: boolean;
  resourceName: string;
  resourceId: string;
  resourceType: 'folder' | 'file';
  parentFolderId: string | null;
  page: 'home' | 'shared' | 'trash' | 'favorites';
  onClose: () => void;
  onSuccess: () => void;
}

const MoveDialog: React.FC<MoveDialogProps> = ({
  open,
  resourceName,
  resourceId,
  resourceType,
  page,
  parentFolderId,
  onClose,
  onSuccess,
}) => {
  const userContext = useUser();
  const [currentParentFolder, setCurrentParentFolder] = useState<Folder | null>(
    null,
  ); // null at root
  const [folders, setFolders] = useState<Folder[]>([]); // child folders of parent
  const [folderHistory, setFolderHistory] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredFolders, setFilteredFolders] = useState<Folder[]>([]);
  const [invalidMoveReason, setInvalidMoveReason] = useState<string | null>(null);

  // fetch subfolders for the given parent folder ID
  const fetchSubFolders = useCallback(
    async (folderId: string | null) => {
      setLoading(true);
      try {
        if (folderId === undefined || folderId === null) {
          const res = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/api/user/${userContext.userId}/${page}/folder`,
            { withCredentials: true },
          );
          if (page === 'shared') {
            // we merely need this check to deal with the permissions thing properly.
            setFolders(res.data.folders);
          } else {
            setFolders(res.data);
          }
        } else {
          const res = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/api/folder/parent/${folderId}`,
            { withCredentials: true },
          );
          setFolders(res.data);
        }
      } catch (error) {
        console.error('Error fetching folders:', error);
        setError('Failed to load folders. Please try again.');
      }
      setLoading(false);
    },
    [page, userContext.userId],
  );

  // reset states when opening dialog
  useEffect(() => {
    if (open) {
      setCurrentParentFolder(null); // set parent folder to null/root
      setFolderHistory([]); // reset history
      setSelectedFolder(null); // automatically select the root directory
      setSearchQuery(''); // reset search query
      fetchSubFolders(null); // load subfolders of root directory
    }
  }, [fetchSubFolders, open]);

  useEffect(() => {
    fetchSubFolders(
      currentParentFolder === null ? null : currentParentFolder.id,
    );
    // automatically select the root directory when at the root
    if (currentParentFolder === null) {
      setSelectedFolder(null);
    }
  }, [currentParentFolder, fetchSubFolders]);

  // Filter folders based on search query
  useEffect(() => {
    let results = [...folders];
    if (searchQuery) {
      results = folders.filter((folder) =>
        folder.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    setFilteredFolders(results);
  }, [folders, searchQuery]);

  // Check if the move is valid whenever selectedFolder changes
  useEffect(() => {
    // Reset the invalid move reason
    setInvalidMoveReason(null);
    
    // Case 1: Can't move a folder to its current location (no change)
    if (selectedFolder?.id === parentFolderId) {
      setInvalidMoveReason("This is already the current location");
      return;
    }
    
    // Case 2: Can't move a resource into itself (for folders)
    if (resourceType === 'folder' && selectedFolder?.id === resourceId) {
      setInvalidMoveReason("Cannot move a folder into itself");
      return;
    }
    
    // Case 3: Can't move to root if already at root
    if (selectedFolder === null && parentFolderId === null) {
      setInvalidMoveReason("Already at root location");
      return;
    }
    
    // Case 4: Check if trying to move to a descendant folder (only applies to folders)
    if (resourceType === 'folder' && folderHistory.some(folder => folder.id === resourceId)) {
      setInvalidMoveReason("Cannot move a folder into its descendant");
      return;
    }
  }, [selectedFolder, parentFolderId, resourceId, resourceType, folderHistory]);

  // select the folder without navigating into it
  const handleSelectFolder = (event: React.MouseEvent, folder: Folder) => {
    event.stopPropagation();
    setSelectedFolder(folder);
  };

  // navigate into the clicked folder and select it
  const handleGoIntoFolder = (event: React.MouseEvent, folder: Folder) => {
    event.stopPropagation();
    
    // Prevent navigation into the folder we're trying to move (if it's a folder)
    if (resourceType === 'folder' && folder.id === resourceId) {
      setError("Cannot navigate into the folder you're trying to move");
      return;
    }
    
    setFolderHistory((prev) => [...prev, folder]);
    setCurrentParentFolder(folder);
    setSelectedFolder(folder);
  };

  // go back to the previous folder
  const handleGoBack = () => {
    if (folderHistory.length > 0) {
      const newHistory = [...folderHistory];
      newHistory.pop();
      const previousFolder =
        newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;
      setFolderHistory(newHistory);
      setCurrentParentFolder(previousFolder);
      setSelectedFolder(previousFolder);
    }
  };

  // move the file to the selected folder
  const handleMove = async () => {
    // Extra validation before making the API call
    if (isInvalidMove()) {
      setError(`Invalid move: ${invalidMoveReason}`);
      return;
    }
    
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/api/${resourceType}/${resourceId}/move`,
        { parentFolderId: selectedFolder === null ? null : selectedFolder.id },
        { withCredentials: true },
      );

      onSuccess();
    } catch (error) {
      console.error('Error moving file:', error);
      setError('Failed to move file. Please try again.');
    }
    handleClose();
  };

  // Helper function to check if move is invalid
  const isInvalidMove = () => {
    return invalidMoveReason !== null;
  };

  // close the dialog and reset state
  const handleClose = () => {
    setCurrentParentFolder(null);
    setSelectedFolder(null);
    setFolderHistory([]);
    setSearchQuery('');
    setInvalidMoveReason(null);
    onClose();
  };

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Generate breadcrumb items
  const generateBreadcrumbs = () => {
    const breadcrumbs: React.ReactNode[] = [];

    // Only add breadcrumbs if we're inside a folder (not at the root)
    folderHistory.forEach((folder, index) => {
      breadcrumbs.push(
        <Link
          underline="hover"
          key={folder.id}
          color="inherit"
          sx={{ 
            cursor: 'pointer', 
            fontWeight: index === folderHistory.length - 1 ? 'bold' : 'normal'
          }}
          onClick={() => {
            const newHistory = folderHistory.slice(0, index + 1);
            setFolderHistory(newHistory);
            setCurrentParentFolder(folder);
          }}
        >
          {folder.name}
        </Link>
      );
    });

    return breadcrumbs;
  };

  // Check if a folder is empty (for empty state display)
  const isFolderEmpty = filteredFolders.length === 0 && !loading;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      onClick={() => {
        setSelectedFolder(currentParentFolder);
      }}
      PaperProps={{
        sx: {
          borderRadius: '12px',
          overflow: 'hidden',
        }
      }}
    >
      {/* Header Section */}
      <DialogTitle 
        sx={{ 
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #eee',
          pb: 1
        }}
      >
        <Typography variant="h6" component="div" fontWeight="bold">
          Move "{resourceName}"
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        {/* Search Box with added spacing above */}
        <Box sx={{ mb: 2, mt: 2 }}>
          <TextField
            fullWidth
            placeholder="Search folders..."
            variant="outlined"
            value={searchQuery}
            onChange={handleSearchChange}
            size="small"
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              ),
              sx: {
                borderRadius: '6px',
              }
            }}
          />
        </Box>

        {/* Breadcrumbs for navigation - only show when not at root */}
        {folderHistory.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Breadcrumbs separator="›" aria-label="breadcrumb">
              {generateBreadcrumbs()}
            </Breadcrumbs>
          </Box>
        )}

        {/* Back Button - only show when in a subfolder */}
        {folderHistory.length > 0 && (
          <ListItem
            component={Paper}
            elevation={0}
            onClick={handleGoBack}
            sx={{
              mb: 1,
              borderRadius: '6px',
              border: '1px solid #e1e4e8',
              backgroundColor: '#f8f9fa',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: '#f1f3f4',
              },
            }}
          >
            <ListItemIcon>
              <ArrowBackIosNewIcon sx={{ color: '#4286f5' }} />
            </ListItemIcon>
            <ListItemText primary="Back to parent folder" />
          </ListItem>
        )}

        {/* Folders Section */}
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ fontWeight: 'bold', mb: 1 }}
        >
          ALL FOLDERS
        </Typography>

        {/* Loading Indicator */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#4286f5' }} />
          </Box>
        ) : isFolderEmpty ? (
          // Empty folder state
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: '6px',
              backgroundColor: '#f9f9f9',
              border: '1px solid #eee',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FolderIcon sx={{ fontSize: 50, color: '#ccc', mb: 2 }} />
            <Typography color="text.secondary" align="center">
              This folder is empty
            </Typography>
          </Paper>
        ) : (
          // Folder List
          <List disablePadding>
            {filteredFolders.map((folder) => {
              // Check if this is the folder we're trying to move (to prevent navigation into itself)
              const isMovingFolder = resourceType === 'folder' && folder.id === resourceId;
              
              return (
                <ListItem
                  key={folder.id}
                  component={Paper}
                  elevation={0}
                  sx={{
                    mb: 1,
                    borderRadius: '6px',
                    backgroundColor: isMovingFolder 
                      ? alpha('#ff9800', 0.1) 
                      : selectedFolder?.id === folder.id
                        ? alpha('#4286f5', 0.1)
                        : 'white',
                    border: '1px solid',
                    borderColor: isMovingFolder
                      ? alpha('#ff9800', 0.3)
                      : selectedFolder?.id === folder.id
                        ? alpha('#4286f5', 0.3)
                        : '#f0f0f0',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    '&:hover': {
                      backgroundColor: isMovingFolder
                        ? alpha('#ff9800', 0.15)
                        : selectedFolder?.id === folder.id
                          ? alpha('#4286f5', 0.15)
                          : '#f5f8ff',
                    },
                  }}
                >
                  {/* Select Folder (Highlight Only) */}
                  <Box 
                    onClick={(e) => handleSelectFolder(e, folder)}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      flex: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <ListItemIcon>
                      <FolderIcon sx={{ color: isMovingFolder ? '#ff9800' : '#4286f5' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={folder.name + (isMovingFolder ? ' (current item)' : '')}
                      primaryTypographyProps={{
                        noWrap: true
                      }}
                    />
                  </Box>

                  {/* Navigate Into Folder */}
                  <IconButton
                    onClick={(e) => handleGoIntoFolder(e, folder)}
                    disabled={isMovingFolder}
                    sx={{
                      color: isMovingFolder ? '#ccc' : '#888',
                      '&:hover': {
                        backgroundColor: alpha('#000', 0.05)
                      }
                    }}
                    size="small"
                  >
                    <ArrowForwardIosIcon fontSize="small" />
                  </IconButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, backgroundColor: '#f8f9fa', borderTop: '1px solid #eee' }}>
        <Button 
          onClick={handleClose} 
          sx={{ 
            borderRadius: '6px',
            px: 2,
            textTransform: 'none',
            color: '#666'
          }}
        >
          Cancel
        </Button>
        <Tooltip title={invalidMoveReason || ''} placement="top" arrow>
          <span>
            <Button
              onClick={handleMove}
              variant="contained"
              sx={{ 
                backgroundColor: '#4286f5',
                borderRadius: '6px',
                px: 2,
                '&:hover': {
                  backgroundColor: '#3a76d8',
                },
                textTransform: 'none'
              }}
              disabled={isInvalidMove()}
            >
              Move
            </Button>
          </span>
        </Tooltip>
      </DialogActions>
      
      {error && (
        <ErrorAlert
          open={!!error}
          message={error}
          onClose={() => setError(null)}
        />
      )}
    </Dialog>
  );
};

export default MoveDialog;