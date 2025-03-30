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
  // const [currentParentFolderId, setCurrentParentFolderId] = useState<
  // string | (null > null);
  const [currentParentFolder, setCurrentParentFolder] = useState<Folder | null>(
    null,
  ); // null at root
  const [folders, setFolders] = useState<Folder[]>([]); // child folders of parent
  const [folderHistory, setFolderHistory] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  // const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [error, setError] = useState<string | null>(null);

  // fetch subfolders whenever the current parent folder changes
  // useEffect(() => {
  //   if (currentParentFolderId !== undefined) {
  //     fetchSubFolders(currentParentFolderId);

  //     // automatically select the root directory when at the root
  //     if (currentParentFolderId === null) {
  //       setSelectedFolderId(null);
  //     }
  //   }
  // }, [currentParentFolderId]);
  // fetch subfolders for the given parent folder ID
  const fetchSubFolders = useCallback(
    async (folderId: string | null) => {
      setLoading(true);
      try {
        if (
          (folderId === undefined || folderId === null) &&
          page !== 'shared'
        ) {
          const res = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/api/user/${userContext.userId}/${page}/folder`,
            // { folderId: folderId ?? null }, // ensure null is passed for root
            { withCredentials: true },
          );

          setFolders(res.data);
        } else {
          if (
            page === 'shared' &&
            (folderId === undefined || folderId === null)
          ) {
            const bubbleUpRes = await axios.get(
              `${process.env.REACT_APP_API_BASE_URL}/api/folder/bubbleUp/${resourceId}`,
              // { folderId: folderId ?? null }, // ensure null is passed for root
              { withCredentials: true },
            );

            folderId = bubbleUpRes.data.fileId;
          }

          const res = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/api/folder/parent/${folderId}`,
            // { folderId: folderId ?? null }, // ensure null is passed for root
            { withCredentials: true },
          );
          setFolders(res.data);
        }
        // const res = await axios.post(
        //   `${process.env.REACT_APP_API_BASE_URL}/api/folder/parent`,
        //   { folderId: folderId ?? null }, // ensure null is passed for root
        //   { withCredentials: true },
        // );
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
      // setCurrentParentFolderId(null); //set to root directory
      setCurrentParentFolder(null); // set parent folder to null/root
      setFolderHistory([]); // reset history
      setSelectedFolder(null); // automatically select the root directory
      fetchSubFolders(null); // load subfolders of root directory
    }
  }, [fetchSubFolders, open]);

  useEffect(() => {
    fetchSubFolders(
      currentParentFolder === null ? null : currentParentFolder.id,
    ); // SWAGMEAT it's because the null can't really be passed in equivalently
    // automatically select the root directory when at the root
    if (currentParentFolder === null) {
      // note that this still expects an ID, not a folder prop
      setSelectedFolder(null);
    }
  }, [currentParentFolder, fetchSubFolders]);

  // select the folder without navigating into it
  const handleSelectFolder = (event: React.MouseEvent, folder: Folder) => {
    event.stopPropagation();
    setSelectedFolder(folder);
  };

  // navigate into the clicked folder and select it
  const handleGoIntoFolder = (event: React.MouseEvent, folder: Folder) => {
    event.stopPropagation();
    setFolderHistory((prev) => [...prev, folder]);
    setCurrentParentFolder(folder);
    setSelectedFolder(folder);
  };

  // // navigate into the clicked folder and select it
  // const handleGoIntoFolder = (event: React.MouseEvent, folderId: string) => {
  //   event.stopPropagation();
  //   setFolderHistory((prev) => [...prev, folderId]);
  //   setCurrentParentFolderId(folderId);
  //   setSelectedFolderId(folderId);
  // };s

  // go back to the previous folder
  const handleGoBack = () => {
    if (folderHistory.length > 0) {
      const newHistory = [...folderHistory];
      newHistory.pop();
      const previousFolder =
        newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;
      setFolderHistory(newHistory);
      setCurrentParentFolder(previousFolder);
      // setCurrentParentFolderId(previousFolder);
      setSelectedFolder(previousFolder);
    }
  };

  // move the file to the selected folder
  const handleMove = async () => {
    // if (selectedFolderId === parentFolderId) return;
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/api/${resourceType}/${resourceId}/move`,
        { parentFolderId: selectedFolder === null ? null : selectedFolder.id }, // sorry for the ugliness
        { withCredentials: true },
      );

      onSuccess();
    } catch (error) {
      console.error('Error moving file:', error);
      setError('Failed to move file. Please try again.');
    }
    handleClose();
  };

  // close the dialog and reset state
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
            ? 'Root Directory'
            : currentParentFolder.name}
        </Typography>

        {/* Back Button */}
        {folderHistory.length > 0 && (
          <IconButton onClick={handleGoBack}>
            <ArrowBackIosNewIcon />
          </IconButton>
        )}

        {/* Loading Indicator */}
        {loading ? (
          <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />
        ) : (
          <List>
            {/* Render Subfolders */}
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
                {/* Select Folder (Highlight Only) */}
                <ListItemText
                  primary={folder.name}
                  onClick={(e) => handleSelectFolder(e, folder)}
                  sx={{ cursor: 'pointer' }}
                />

                {/* Navigate Into Folder */}
                <IconButton
                  onClick={(e) => handleGoIntoFolder(e, folder)}
                  disabled={resourceId == folder.id}
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
