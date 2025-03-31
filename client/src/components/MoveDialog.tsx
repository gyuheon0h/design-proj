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
} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIos';
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
  );
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderHistory, setFolderHistory] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [rootDirectoryName, setRootDirectoryName] = useState<String>();
  const [error, setError] = useState<string | null>(null);

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

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      const init = async () => {
        if (page === 'shared') {
          try {
            const bubbleUpRes = await axios.get(
              `${process.env.REACT_APP_API_BASE_URL}/api/folder/bubbleUpFolder/${resourceId}`,
              { withCredentials: true },
            );

            // Ensure bubbleUpRes.data returns a Folder object.
            setCurrentParentFolder(null);
            setSelectedFolder(bubbleUpRes.data);
            setRootDirectoryName('Shared - ' + bubbleUpRes.data.name);
            await fetchSubFolders(bubbleUpRes.data.id);
          } catch (error) {
            console.error('Error fetching shared folder:', error);
            setError('Failed to load shared folder. Please try again.');
          }
        } else {
          setCurrentParentFolder(null); // set to root
          setSelectedFolder(null); // automatically select the root directory
          setRootDirectoryName(
            page.charAt(0).toUpperCase() + page.slice(1) + ' - Root Directory',
          );
          await fetchSubFolders(null); // load subfolders of root directory
        }
        setFolderHistory([]); // reset history
      };

      init();
    }
  }, [fetchSubFolders, open, page, resourceId]);

  useEffect(() => {
    fetchSubFolders(
      currentParentFolder === null ? null : currentParentFolder.id,
    );
    if (currentParentFolder === null) {
      setSelectedFolder(null);
    }
  }, [currentParentFolder, fetchSubFolders]);

  // Select folder without navigating into it
  const handleSelectFolder = (event: React.MouseEvent, folder: Folder) => {
    event.stopPropagation();
    setSelectedFolder(folder);
  };

  // Navigate into folder
  const handleGoIntoFolder = (event: React.MouseEvent, folder: Folder) => {
    event.stopPropagation();
    setFolderHistory((prev) => [...prev, folder]);
    setCurrentParentFolder(folder);
    setSelectedFolder(folder);
  };

  // Go back to the previous folder
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

  // Move the resource to the selected folder
  const handleMove = async () => {
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

  // Close the dialog and reset state
  const handleClose = () => {
    setCurrentParentFolder(null);
    setSelectedFolder(null);
    setFolderHistory([]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      onClick={() => {
        setSelectedFolder(currentParentFolder);
      }}
    >
      <DialogTitle>Move "{resourceName}"</DialogTitle>
      <DialogContent>
        <Typography>
          Current Folder:{' '}
          {currentParentFolder === null
            ? rootDirectoryName
            : currentParentFolder.name}
        </Typography>

        {folderHistory.length > 0 && (
          <IconButton onClick={handleGoBack}>
            <ArrowBackIosNewIcon />
          </IconButton>
        )}

        {loading ? (
          <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />
        ) : (
          <List>
            {folders.map((folder) => (
              <ListItem
                key={folder.id}
                component="div"
                sx={{
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor:
                    (selectedFolder === null ? null : selectedFolder.id) ===
                    folder.id
                      ? 'rgba(0, 0, 255, 0.1)'
                      : 'transparent',
                }}
              >
                <ListItemText
                  primary={folder.name}
                  onClick={(e) => handleSelectFolder(e, folder)}
                  sx={{ cursor: 'pointer' }}
                />

                <IconButton
                  onClick={(e) => handleGoIntoFolder(e, folder)}
                  disabled={resourceId === folder.id}
                >
                  <ArrowForwardIosIcon />
                </IconButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={handleMove}
          color="primary"
          variant="contained"
          disabled={
            (selectedFolder === null && parentFolderId === null) ||
            (selectedFolder !== null && selectedFolder.id === parentFolderId) ||
            (selectedFolder !== null && selectedFolder.id === resourceId)
          }
        >
          Move
        </Button>
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
