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
import { useUser } from '../context/UserContext';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIos';
import axios from 'axios';
import ErrorAlert from '../components/ErrorAlert';

export interface FolderProps {
  id: string;
  name: string;
  parentFolder: string | null;
}

interface MoveDialogProps {
  page: 'home' | 'shared' | 'favorites' | 'trash';
  open: boolean;
  fileName: string;
  resourceId: string;
  resourceType: 'folder' | 'file';
  parentFolderId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const MoveDialog: React.FC<MoveDialogProps> = ({
  page,
  open,
  fileName,
  resourceId,
  resourceType,
  parentFolderId,
  onClose,
  onSuccess,
}) => {
  const userContext = useUser();
  const [currentParentFolderId, setCurrentParentFolderId] = useState<
    string | null
  >(null);
  const [folders, setFolders] = useState<FolderProps[]>([]);
  const [folderHistory, setFolderHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // fetch subfolders for the given parent folder ID
  const fetchSubFolders = useCallback(
    async (folderId: string | null, userId: string | null) => {
      setLoading(true);
      try {
        if (folderId === null) {
          const res = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/api/user/${userId}/${page}/folder`,
            // { folderId: folderId ?? null }, // ensure null is passed for root
            { withCredentials: true },
          );
          console.log('Fetched folders:', res.data);
          console.log('the current page we are on: ', `${page}`);
          if (`${page}` === 'shared') {
            // the shared page interesting has a different behavior than the other home pages.
            setFolders(res.data.folders || {});
          } else {
            setFolders(res.data || {});
          }
        } else {
          const res = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/api/folder/${folderId}/parent`,
            // { folderId: folderId ?? null }, // ensure null is passed for root
            { withCredentials: true },
          );
          console.log(
            'I think this is a very concerning area to be in so just logging here.',
          );
          console.log('Fetched folders:', res.data);
          setFolders(res.data.folders || []);
        }
      } catch (error) {
        console.error('Error fetching folders:', error);
        setError('Failed to load folders. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [page],
  );

  useEffect(() => {
    if (open && userContext.userId) {
      fetchSubFolders(null, userContext.userId);
    }
  }, [open, fetchSubFolders, userContext.userId]);

  // reset states when opening dialog
  useEffect(() => {
    if (open) {
      setCurrentParentFolderId(null); //set to root directory
      setFolderHistory([]); // reset history
      setSelectedFolderId(null); // automatically select the root directory
      fetchSubFolders(null, userContext.userId); // load subfolders of root directory
    }
  }, [open, fetchSubFolders, userContext.userId]);

  // fetch subfolders whenever the current parent folder changes
  useEffect(() => {
    if (currentParentFolderId !== undefined) {
      fetchSubFolders(currentParentFolderId, userContext.userId);

      // automatically select the root directory when at the root
      if (currentParentFolderId === null) {
        setSelectedFolderId(null);
      }
    }
  }, [currentParentFolderId, fetchSubFolders, userContext.userId]);

  // select the folder without navigating into it
  const handleSelectFolder = (event: React.MouseEvent, folderId: string) => {
    event.stopPropagation();
    setSelectedFolderId(folderId);
  };

  // navigate into the clicked folder and select it
  const handleGoIntoFolder = (event: React.MouseEvent, folderId: string) => {
    event.stopPropagation();
    setFolderHistory((prev) => [...prev, folderId]);
    setCurrentParentFolderId(folderId);
    setSelectedFolderId(folderId);
  };

  // go back to the previous folder
  const handleGoBack = () => {
    if (folderHistory.length > 0) {
      const newHistory = [...folderHistory];
      newHistory.pop();
      const previousFolder =
        newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;
      setFolderHistory(newHistory);
      setCurrentParentFolderId(previousFolder);
      setSelectedFolderId(previousFolder);
    }
  };

  // move the file to the selected folder
  const handleMove = async () => {
    if (selectedFolderId === parentFolderId) return;
    try {
      await axios.patch(
        `http://${process.env.REACT_APP_API_BASE_URL}/api/${resourceType}/${resourceId}/move`,
        { parentFolderId: selectedFolderId },
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
    setCurrentParentFolderId(null);
    setSelectedFolderId(null);
    setFolderHistory([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Move "{fileName}"</DialogTitle>
      <DialogContent>
        <Typography>
          Current Folder:{' '}
          {currentParentFolderId === null
            ? 'Root Directory'
            : currentParentFolderId}
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
                    selectedFolderId === folder.id
                      ? 'rgba(0, 0, 255, 0.1)'
                      : 'transparent',
                }}
              >
                {/* Select Folder (Highlight Only) */}
                <ListItemText
                  primary={folder.name}
                  onClick={(e) => handleSelectFolder(e, folder.id)}
                  sx={{ cursor: 'pointer' }}
                />

                {/* Navigate Into Folder */}
                <IconButton onClick={(e) => handleGoIntoFolder(e, folder.id)}>
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
          disabled={!selectedFolderId && parentFolderId === null}
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
