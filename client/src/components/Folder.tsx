import React, { useState, useEffect } from 'react';
import SendIcon from '@mui/icons-material/Send';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import RestoreIcon from '@mui/icons-material/Restore';
import Divider from '@mui/material/Divider';
import { Box, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { colors } from '../Styles';
import RenameDialog from './RenameDialog';
import PermissionDialog from './PermissionsDialog';
import MoveDialog from './MoveDialog';
import { getIsFavoritedByFileId } from '../utils/helperRequests';
import ErrorAlert from '../components/ErrorAlert';
import { Folder } from '../interfaces/Folder';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

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

    // console.log(props.page);
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
    // console.log(
    //   'The parent of the favorited folder is: ' + props.folder.parentFolder,
    // );
  };

  const handleFavoriteFolder = async (folderId: string) => {
    try {
      // NOTE: using the user based permission to favorite but still calling the PATCH within the folder router
      await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/api/folder/${folderId}/favorite`,
        {},
        {
          withCredentials: true,
        },
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
    // const ownerUsername = await getUsernameById(owner);

    // TODO: is this neccessary? will non-owners see deleted files/folders shared w them?
    // if (ownerUsername !== username) {
    //   alert('You do not have permission to restore this folder.');
    //   return;
    // }
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/api/folder/${folderId}/restore`,
        {},
        {
          withCredentials: true,
        },
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
        },
      );
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  };

  //DIALOG CLICK TRIGGERS (Rename, Permissions/Share, Move)
  const handleRenameClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsRenameDialogOpen(true);
    setAnchorEl(null);
    // props.refreshFolders(props.folder.parentFolder);
  };

  const handlePermissionsClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsPermissionsDialogOpen(true);
    setAnchorEl(null);
    // props.refreshFolders(props.folder.parentFolder);
  };

  const handleMoveClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsMoveDialogOpen(true);
    setAnchorEl(null);
    // props.refreshFolders(props.folder.parentFolder);
  };

  return (
    <Box
      className="folder"
      data-folder-id={props.folder.id}
      onClick={handleFolderClick}
      sx={{
        position: 'relative',
        width: '150px',
        height: '100px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&:hover .folder-body, &:hover .folder-tab': {
          backgroundColor: '#A9C3E5',
        },
      }}
    >
      {/* Folder Tab */}
      <Box
        className="folder-tab"
        sx={{
          position: 'absolute',
          top: '-10px',
          left: '0px',
          width: '70px',
          height: '15px',
          backgroundColor: colors.lightBlue,
          borderRadius: '5px 5px 0 0',
          transition: 'background-color 0.3s',
        }}
      />
      {/* Folder Body */}
      <Box
        className="folder-body"
        sx={{
          width: '100%',
          height: '100%',
          backgroundColor: colors.lightBlue,
          borderRadius: '0px 10px 5px 5px',
          boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.3s',
        }}
      >
        {/* Folder Name */}
        <Typography
          variant="h4"
          sx={{
            color: colors.darkBlue,
            fontWeight: 'bold',
            textAlign: 'center',
            maxWidth: '100px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {props.folder.name}
        </Typography>

        {/* Favorite Button */}
        <IconButton
          onClick={handleFavoriteFolderClick}
          sx={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            color: isFavorited ? '#FF6347' : colors.darkBlue,
          }}
        >
          {isFavorited ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        </IconButton>

        {/* More Options Button */}
        <IconButton
          onClick={handleOptionsClick}
          sx={{
            position: 'absolute',
            bottom: '5px',
            right: '5px',
            color: '#5d4037',
          }}
        >
          <MoreHorizIcon />
        </IconButton>

        {/* Dropdown Menu */}
        <Menu anchorEl={anchorEl} open={open} onClose={handleOptionsClose}>
          {props.page === 'trash' ? (
            <MenuItem onClick={handleRestoreClick}>
              <RestoreIcon sx={{ fontSize: '20px', marginRight: '9px' }} />{' '}
              Restore
            </MenuItem>
          ) : props.page === 'shared' ? (
            []
          ) : (
            [
              <MenuItem onClick={handlePermissionsClick}>
                <SendIcon sx={{ fontSize: '20px', marginRight: '9px' }} /> Share
              </MenuItem>,
              <Divider sx={{ my: 0.2 }} />,
              <MenuItem onClick={handleRenameClick}>
                <DriveFileRenameOutlineIcon
                  sx={{ fontSize: '20px', marginRight: '9px' }}
                />
                Rename
              </MenuItem>,
              <Divider sx={{ my: 0.2 }} />,
              <MenuItem onClick={handleDeleteClick}>
                <DeleteIcon sx={{ fontSize: '20px', marginRight: '9px' }} />{' '}
                Delete
              </MenuItem>,
              <Divider sx={{ my: 0.2 }} />,
              <MenuItem onClick={(e) => e.stopPropagation()}>
                <UploadIcon sx={{ fontSize: '20px', marginRight: '9px' }} />
                Download
              </MenuItem>,

              <Divider sx={{ my: 0.2 }} />,

              <MenuItem onClick={handleMoveClick}>
                <SendIcon sx={{ fontSize: '20px', marginRight: '9px' }} /> Move
              </MenuItem>,
            ]
          )}
        </Menu>
      </Box>
      {/* Rename Folder Dialog */}
      <RenameDialog
        open={isRenameDialogOpen}
        resourceName={props.folder.name}
        resourceId={props.folder.id}
        resourceType="folder"
        onClose={() => setIsRenameDialogOpen(false)}
        onSuccess={() => props.refreshFolders(props.folder.parentFolder)}
      />
      {/* //TODO: idk whether to use the double fileId/folderId or
      resourceId/resourceType */}

      <PermissionDialog
        open={isPermissionsDialogOpen}
        onClose={() => setIsPermissionsDialogOpen(false)}
        fileId={null}
        folderId={props.folder.id}
        // onShareSuccess={() => props.refreshFolders(props.folder.parentFolder)}
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
