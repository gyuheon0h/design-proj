import React, { useEffect, useRef, useState } from 'react';
import {
  Card,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Box,
  Tooltip,
} from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import SendIcon from '@mui/icons-material/Send';
import RestoreIcon from '@mui/icons-material/Restore';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import MovieIcon from '@mui/icons-material/Movie';
import {
  getUsernameById,
  downloadFile,
  getBlobGcskey,
} from '../utils/helperRequests';
import RenameFileDialog from './RenameDialog';
import PermissionDialog from './PermissionsDialog';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FileViewerDialog from './FileViewerDialog';
import { colors } from '../Styles';

export interface FileComponentProps {
  page: 'home' | 'shared' | 'favorites' | 'trash';
  id: string;
  name: string;
  owner: string;
  createdAt: Date;
  lastModifiedBy: string | null;
  lastModifiedAt: Date;
  parentFolder: string | null;
  gcsKey: string;
  fileType: string;
  isFavorited: boolean;
  handleRestoreFile: (fileId: string) => void;
  handleDeleteFile: (fileId: string) => void;
  handleRenameFile: (fileId: string, newFileName: string) => void;
  handleFavoriteFile: (fileId: string) => void;
}

const getFileIcon = (fileType: string) => {
  const lowerCaseType = fileType.trim().toLowerCase();
  const mimeType = lowerCaseType.split('/')[0];

  switch (mimeType) {
    case 'text':
      return <DescriptionIcon sx={{ fontSize: 30, marginRight: '10px' }} />;
    case 'application':
      if (lowerCaseType === 'application/json')
        return (
          <EditNoteIcon
            sx={{ fontSize: 30, marginRight: '10px', color: 'blue' }}
          />
        );
      return (
        <InsertDriveFileIcon
          sx={{ fontSize: 30, marginRight: '10px', color: 'red' }}
        />
      );
    case 'image':
      return <ImageIcon sx={{ fontSize: 30, marginRight: '10px' }} />;
    case 'audio':
      return <MusicNoteIcon sx={{ fontSize: 30, marginRight: '10px' }} />;
    case 'video':
      return <MovieIcon sx={{ fontSize: 30, marginRight: '10px' }} />;
    default:
      return <InsertDriveFileIcon sx={{ fontSize: 30, marginRight: '10px' }} />;
  }
};

const FileComponent = (props: FileComponentProps) => {
  const [ownerUserName, setOwnerUserName] = useState<string>('Loading...');
  const [modifiedByName, setModifiedByName] = useState<string>('Loading...');
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const fileCache = useRef(new Map<string, string>()); // Woah this speeds up reopens by a LOT

  // For the image viewer
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [fileSrc, setFileSrc] = useState('');

  useEffect(() => {
    const fetchOwnerUserName = async () => {
      if (props.owner) {
        try {
          const username = await getUsernameById(props.owner);
          setOwnerUserName(username || 'Unknown');
        } catch (error) {
          console.error('Error fetching username:', error);
          setOwnerUserName('Unknown');
        }
      }
    };

    fetchOwnerUserName();
  }, [props.owner]);

  useEffect(() => {
    const fetchModifiedByName = async () => {
      if (props.lastModifiedBy) {
        try {
          const username = await getUsernameById(props.lastModifiedBy);
          setModifiedByName(username || 'Unknown');
        } catch (error) {
          console.error('Error fetching username:', error);
          setModifiedByName('Unknown');
        }
      }
    };

    fetchModifiedByName();
  }, [props.lastModifiedBy]);

  const open = Boolean(anchorEl);

  const handleFileClick = async () => {
    // Check if file is already cached

    console.log(props.fileType);
    if (fileCache.current.has(props.gcsKey)) {
      setFileSrc(fileCache.current.get(props.gcsKey) as string);
      setIsFileViewerOpen(true);
      return;
    }

    if (
      props.fileType.startsWith('image/') ||
      props.fileType.startsWith('video/')
    ) {
      try {
        const imageBlob = await getBlobGcskey(props.gcsKey, props.fileType);
        const objectUrl = URL.createObjectURL(imageBlob);

        // Store in cache
        fileCache.current.set(props.gcsKey, objectUrl);

        setFileSrc(objectUrl);
        setIsFileViewerOpen(true);
      } catch (err) {
        console.error('Error fetching image from server:', err);
        alert('Error fetching image');
      }
    }
    return;
  };

  const handleCloseFileViewer = () => {
    setIsFileViewerOpen(false);
  };

  const handleOptionsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleOptionsClose = () => {
    setAnchorEl(null);
  };

  const handleRenameClick = () => {
    setIsRenameDialogOpen(true);
    handleOptionsClose();
  };

  const handlePermissionsClick = () => {
    setIsPermissionsDialogOpen(true);
    handleOptionsClose();
  };

  const handleRenameFile = (newFileName: string) => {
    props.handleRenameFile(props.id, newFileName);
  };

  const handleFavoriteFile = () => {
    props.handleFavoriteFile(props.id);
  };

  const handleRestoreFile = () => {
    props.handleRestoreFile(props.id);
  };

  const lastModifiedDate = new Date(props.lastModifiedAt);
  const formattedLastModifiedDate = !isNaN(lastModifiedDate.getTime())
    ? lastModifiedDate.toLocaleDateString()
    : 'Unknown';

  return (
    <div>
      <Card
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px',
          margin: '10px 0',
          boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
          backgroundColor: '#f5f5f5',
          transition: 'background-color 0.3s',
          '&:hover': {
            backgroundColor: '#e0e0e0',
          },
        }}
        onClick={() => {
          handleFileClick();
        }}
      >
        {getFileIcon(props.fileType)}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexGrow: 1,
            overflow: 'hidden',
            justifyContent: 'space-around',
          }}
        >
          <Tooltip title={props.name} arrow>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 'bold',
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {props.name}
            </Typography>
          </Tooltip>

          <Tooltip title={ownerUserName} arrow>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                maxWidth: '150px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Owner: {ownerUserName}
            </Typography>
          </Tooltip>

          <Tooltip
            title={`Last Modified: ${formattedLastModifiedDate} by ${modifiedByName || ownerUserName}`}
            arrow
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Last Modified: {formattedLastModifiedDate} by{' '}
              {modifiedByName || ownerUserName}
            </Typography>
          </Tooltip>
        </Box>

        {/* Favorites Toggle Button */}
        <IconButton
          onClick={(e) => {
            if (props.page === 'trash') {
              alert('Restore the folder to update it!');
            } else {
              handleFavoriteFile();
            }
          }}
          sx={{
            color: props.isFavorited ? '#FF6347' : colors.darkBlue,
          }}
        >
          {props.isFavorited ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        </IconButton>

        <IconButton onClick={handleOptionsClick}>
          <MoreHorizIcon />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleOptionsClose}
          PaperProps={{
            sx: {
              width: '150px',
            },
          }}
        >
          {props.page === 'trash' ? (
            <MenuItem
              onClick={() => {
                handleRestoreFile();
                handleOptionsClose();
              }}
            >
              <RestoreIcon sx={{ fontSize: '20px', marginRight: '9px' }} />{' '}
              Restore
            </MenuItem>
          ) : props.page === 'shared' ? (
            <MenuItem
              onClick={() => {
                downloadFile(props.id, props.name);
                handleOptionsClose();
              }}
            >
              <InsertDriveFileIcon
                sx={{ fontSize: '20px', marginRight: '9px' }}
              />{' '}
              Download
            </MenuItem>
          ) : (
            [
              <MenuItem onClick={handlePermissionsClick}>
                <SendIcon sx={{ fontSize: '20px', marginRight: '9px' }} /> Share
              </MenuItem>,

              <Divider sx={{ my: 0.2 }} />,

              <MenuItem onClick={handleRenameClick}>
                <DriveFileRenameOutlineIcon
                  sx={{ fontSize: '20px', marginRight: '9px' }}
                />{' '}
                Rename
              </MenuItem>,

              <Divider sx={{ my: 0.2 }} />,

              <MenuItem
                onClick={() => {
                  props.handleDeleteFile(props.id);
                  handleOptionsClose();
                }}
              >
                <DeleteIcon sx={{ fontSize: '20px', marginRight: '9px' }} />{' '}
                Delete
              </MenuItem>,

              <Divider sx={{ my: 0.2 }} />,

              <MenuItem
                onClick={() => {
                  downloadFile(props.id, props.name);
                  handleOptionsClose();
                }}
              >
                <InsertDriveFileIcon
                  sx={{ fontSize: '20px', marginRight: '9px' }}
                />{' '}
                Download
              </MenuItem>,
            ]
          )}
        </Menu>
      </Card>

      <RenameFileDialog
        open={isRenameDialogOpen}
        fileName={props.name}
        onClose={() => setIsRenameDialogOpen(false)}
        onRename={handleRenameFile}
      />

      <PermissionDialog
        open={isPermissionsDialogOpen}
        onClose={() => setIsPermissionsDialogOpen(false)}
        fileId={props.id}
        folderId={null}
      />
      <FileViewerDialog
        open={isFileViewerOpen}
        onClose={handleCloseFileViewer}
        src={fileSrc}
        fileType={props.fileType}
      />
    </div>
  );
};

export default FileComponent;
