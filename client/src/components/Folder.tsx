import React, { useState } from 'react';
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
import ErrorAlert from '../components/ErrorAlert';

export interface FolderProps {
  page: 'home' | 'shared' | 'favorites' | 'trash';
  id: string;
  name: string;
  owner: string;
  createdAt: Date;
  parentFolder: string | null;
  isFavorited: boolean;
  onClick: (folder: FolderProps) => void;
  handleDeleteFolder: (folderId: string) => Promise<void>;
  handleFavoriteFolder: (folderId: string) => void;
  handleRestoreFolder: (folderId: string) => void;
  handleRenameFolder: (folderId: string, newFolderName: string) => void;
}

const [error, setError] = useState<string | null>(null);

const Folder = (props: FolderProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const open = Boolean(anchorEl);

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

  const handleFavoriteFolder = (event: React.MouseEvent) => {
    event.stopPropagation();
    props.handleFavoriteFolder(props.id);
  };

  const handleRenameClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsRenameDialogOpen(true);
    setAnchorEl(null);
  };

  const handleRenameFolder = (newFolderName: string) => {
    if (!newFolderName.trim()) return;
    props.handleRenameFolder(props.id, newFolderName);
    setIsRenameDialogOpen(false);
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
      className="folder"
      data-folder-id={props.id}
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
          {props.name}
        </Typography>

        {/* Favorite Button */}
        <IconButton
          onClick={(e) => {
            if (props.page === 'trash') {
              setError('Restore the folder to update it!');
            } else {
              handleFavoriteFolder(e);
            }
          }}
          sx={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            color: props.isFavorited ? '#FF6347' : colors.darkBlue,
          }}
        >
          {props.isFavorited ? <FavoriteIcon /> : <FavoriteBorderIcon />}
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
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                props.handleRestoreFolder(props.id);
                handleOptionsClose(e);
              }}
            >
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
              <MenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  props.handleDeleteFolder(props.id);
                  handleOptionsClose(e);
                }}
              >
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
        fileName={props.name}
        onClose={() => setIsRenameDialogOpen(false)}
        onRename={handleRenameFolder}
      />

      <PermissionDialog
        open={isPermissionsDialogOpen}
        onClose={() => setIsPermissionsDialogOpen(false)}
        fileId={null}
        folderId={props.id}
      />

      <MoveDialog
        open={isMoveDialogOpen}
        onClose={() => setIsMoveDialogOpen(false)}
        fileName={props.name}
        fileId={props.id}
        resourceType="folder"
        parentFolderId={props.parentFolder}
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

export default Folder;
