import React, { useState, useEffect } from 'react';
import SendIcon from '@mui/icons-material/Send';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import Divider from '@mui/material/Divider';
import { Box, Typography, IconButton, Menu, MenuItem, Paper } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import FolderIcon from '@mui/icons-material/Folder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { colors, folderStyles } from '../Styles';
import RenameDialog from './RenameDialog';
import PermissionDialog from './PermissionsDialog';
import MoveDialog from './MoveDialog';
import { getIsFavoritedByFileId } from '../utils/helperRequests';
import ErrorAlert from '../components/ErrorAlert';
import { Folder } from '../interfaces/Folder';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { DriveFileMove } from '@mui/icons-material';

export interface FolderProps {
  page: 'home' | 'shared' | 'favorites' | 'trash';
  folder: Folder;
  onClick: (folder: FolderProps) => void;
  refreshFolders: (folderId: string | null) => void;
}

const FolderComponent = (props: FolderProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const open = Boolean(anchorEl);
  const [error, setError] = useState<string | null>(null);
  const curr_loc = useLocation();

  useEffect(() => {
    const fetchIsFavorited = async () => {
      try {
        const isFavorited = await getIsFavoritedByFileId(props.folder.id);
        setIsFavorited(isFavorited);
      } catch (error) {
        console.error('Error fetching isFavorited for folder', error);
        setError('Error fetching isFavorited for folder');
      }
    };

    fetchIsFavorited();
  }, [props.folder.id]);

  const handleOptionsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleOptionsClose = (
    event: {},
    reason?: 'backdropClick' | 'escapeKeyDown',
  ) => {
    if (event && 'stopPropagation' in event) {
      (event as React.MouseEvent).stopPropagation();
    }
    setAnchorEl(null);
  };

  const handleFolderClick = () => {
    if (isRenameDialogOpen || isPermissionsDialogOpen || isMoveDialogOpen)
      return;
    props.onClick(props);
  };

  // FAVORITE Event Handlers
  const handleFavoriteFolderClick = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (props.page === 'trash') {
      alert('Restore the folder to update it!');
    } else {
      await handleFavoriteFolder(props.folder.id);
      setIsFavorited(!isFavorited); // toggle state locally
    }

    if (
      (props.page === 'shared' &&
        (curr_loc.pathname === '/shared' ||
          curr_loc.pathname === '/shared/')) ||
      (props.page === 'favorites' && curr_loc.pathname === '/favorites') ||
      curr_loc.pathname === '/favorites/'
    ) {
      // we shouldn't attempt to navigate away from the favorites page:
      props.refreshFolders(null);
    } else {
      props.refreshFolders(props.folder.parentFolder);
    }
  };

  const handleFavoriteFolder = async (folderId: string) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/api/folder/${folderId}/favorite`,
        {},
        {
          withCredentials: true,
        }
      );
    } catch (error) {
      console.error('Error favoriting folder:', error);
    }
  };

  // RESTORE Event Handlers
  const handleRestoreClick = async (event: React.MouseEvent) => {
    event.stopPropagation();
    await handleRestoreFolder(props.folder.id, props.folder.owner);
    setAnchorEl(null);
    props.refreshFolders(props.folder.parentFolder);
  };

  const handleRestoreFolder = async (folderId: string, owner: string) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/api/folder/${folderId}/restore`,
        {},
        {
          withCredentials: true,
        }
      );
    } catch (error) {
      console.error('Error restoring folder:', error);
    }
  };

  // DELETE Event Handlers
  const handleDeleteClick = async (event: React.MouseEvent) => {
    event.stopPropagation();
    await handleDeleteFolder(props.folder.id);
    setAnchorEl(null);
    props.refreshFolders(props.folder.parentFolder);
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_BASE_URL}/api/folder/${folderId}/delete`,
        {
          withCredentials: true,
        }
      );
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  };

  // DIALOG CLICK TRIGGERS (Rename, Permissions/Share, Move)
  const handleRenameClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsRenameDialogOpen(true);
    setAnchorEl(null);
  };

  const handlePermissionsClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsPermissionsDialogOpen(true);
    setAnchorEl(null);
  };

  const handleMoveClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsMoveDialogOpen(true);
    setAnchorEl(null);
  };

  return (
    <Box 
      sx={{ 
        ...folderStyles.container,
        width: '140px',
        height: 'auto',
        margin: '8px',
        position: 'relative',
        cursor: 'pointer'
      }}
      onClick={handleFolderClick}
    >
      {/* Container for folder with overlaid elements */}
      <Box sx={{ position: 'relative' }}>
        {/* Folder Icon as background */}
        <FolderIcon 
          sx={{ 
            fontSize: 100, 
            color: '#64B5F6',
            width: '100%', 
            height: 'auto',
            display: 'block'
          }} 
        />
        
        {/* Folder Name - positioned on the folder */}
        <Typography 
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontWeight: 'medium',
            fontSize: '14px',
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '70%',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}
        >
          {props.folder.name}
        </Typography>
        
        {/* Favorite Button - On top-left of folder */}
        <IconButton
          onClick={handleFavoriteFolderClick}
          size="small"
          sx={{
            position: 'absolute',
            bottom: 25,
            left: 15,
            color: isFavorited ? '#FF6347' : 'rgba(255, 255, 255, 0.8)',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            padding: '2px',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
            },
          }}
        >
          {isFavorited ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
        </IconButton>
        
        {/* More Options Button - On top-right of folder */}
        <IconButton
          size="small"
          onClick={handleOptionsClick}
          sx={{
            position: 'absolute',
            bottom: 25,
            right: 15,
            color: 'rgba(255, 255, 255, 0.8)',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            padding: '2px',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
            },
          }}
        >
          <MoreHorizIcon fontSize="small" />
        </IconButton>
      </Box>
  
      {/* Menu and dialogs remain unchanged */}
      <Menu 
        anchorEl={anchorEl} 
        open={open} 
        onClose={handleOptionsClose}
        elevation={2}
        PaperProps={{
          sx: {
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            width: '180px',
          }
        }}
      >
        {props.page === 'trash' ? (
          <MenuItem onClick={handleRestoreClick}>
            <RestoreIcon sx={{ fontSize: '20px', marginRight: '9px' }} /> Restore
          </MenuItem>
        ) : props.page === 'shared' ? (
          []
        ) : (
          [
            <MenuItem key="share" onClick={handlePermissionsClick}>
              <SendIcon sx={{ fontSize: '20px', marginRight: '9px' }} /> Share
            </MenuItem>,
            <Divider key="div1" sx={{ my: 0.2 }} />,
            <MenuItem key="rename" onClick={handleRenameClick}>
              <DriveFileRenameOutlineIcon sx={{ fontSize: '20px', marginRight: '9px' }} /> Rename
            </MenuItem>,
            <Divider key="div2" sx={{ my: 0.2 }} />,
            <MenuItem key="move" onClick={handleMoveClick}>
              <DriveFileMove sx={{ fontSize: '20px', marginRight: '9px' }} /> Move
            </MenuItem>,
            <Divider key="div3" sx={{ my: 0.2 }} />,
            <MenuItem key="delete" onClick={handleDeleteClick} sx={{ color: '#FF6347' }}>
              <DeleteIcon sx={{ fontSize: '20px', marginRight: '9px', color: '#FF6347' }} /> Delete
            </MenuItem>
          ]
        )}
      </Menu>
  
      {/* Dialogs */}
      <RenameDialog
        open={isRenameDialogOpen}
        resourceName={props.folder.name}
        resourceId={props.folder.id}
        resourceType="folder"
        onClose={() => setIsRenameDialogOpen(false)}
        onSuccess={() => props.refreshFolders(props.folder.parentFolder)}
      />
  
      <PermissionDialog
        open={isPermissionsDialogOpen}
        onClose={() => setIsPermissionsDialogOpen(false)}
        fileId={null}
        folderId={props.folder.id}
      />
  
      <MoveDialog
        open={isMoveDialogOpen}
        onClose={() => setIsMoveDialogOpen(false)}
        resourceName={props.folder.name}
        page={props.page}
        resourceId={props.folder.id}
        resourceType="folder"
        parentFolderId={props.folder.parentFolder}
        onSuccess={() => props.refreshFolders(props.folder.parentFolder)}
      />
      
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

export default FolderComponent;