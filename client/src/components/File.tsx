import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  Modal,
  Fade,
  Avatar,
  TableRow,
  TableCell,
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
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FolderIcon from '@mui/icons-material/Folder';
import HomeIcon from '@mui/icons-material/Home';
import RenameDialog from './RenameDialog';
import {
  getUsernameById,
  downloadFile,
  getBlobGcskey,
  getIsFavoritedByFileId,
  getPermissionByFileId,
} from '../utils/helperRequests';
import PermissionDialog from './PermissionsDialog';
import FileViewerDialog from './FileViewerDialog';
import { colors, avatarStyles } from '../Styles';
import MoveDialog from './MoveDialog';
import {
  isSupportedFileTypeText,
  isSupportedFileTypeVideo,
} from '../utils/fileTypeHelpers';
import ErrorAlert from '../components/ErrorAlert';
import { File } from '../interfaces/File';
import axios from 'axios';
import TextEditor from './TextEditor';
import { Permission } from '../interfaces/Permission';
import OwlNoteEditorDialog from './OwlNoteEditorDialog';
import { useStorage } from '../context/StorageContext';
import { useUser } from '../context/UserContext';
import { DriveFileMove } from '@mui/icons-material';

export interface FileComponentProps {
  page: 'home' | 'shared' | 'favorites' | 'trash';
  file: File;
  refreshFiles: (folderId: string | null) => void;
  showLocation?: boolean; // New prop to control location display
}

// Array of avatar colors to use
const AVATAR_COLORS = [
  '#F44336', // Red
  '#673AB7', // Deep Purple
  '#2196F3', // Blue
  '#4CAF50', // Green
  '#FF9800', // Orange
  '#607D8B', // Blue Grey
  '#9C27B0', // Purple
  '#00BCD4', // Cyan
  '#009688', // Teal
  '#E91E63', // Pink
];

// Function to get a consistent color based on the username
const getAvatarColor = (username: string): string => {
  if (!username || username === 'N/A' || username === 'Unknown') {
    return '#9E9E9E'; // Default gray for unknown/NA users
  }
  
  // Get the first character of the username (case-insensitive)
  const firstChar = username.trim().charAt(0).toLowerCase();
  
  // Convert character to a number (a=0, b=1, etc)
  const charCode = firstChar.charCodeAt(0);
  
  // Use modulo to get an index within our color array
  const colorIndex = charCode % AVATAR_COLORS.length;
  
  // Return the color at that index
  return AVATAR_COLORS[colorIndex];
};

const getFileIcon = (fileType: string) => {
  const lowerCaseType = fileType.trim().toLowerCase();
  const mimeType = lowerCaseType.split('/')[0];
  const extension = lowerCaseType.split('/')[1];

  // Define background colors based on file type
  let iconColor = colors.fileGray;
  if (mimeType === 'image') iconColor = colors.fileImage;
  else if (mimeType === 'video') iconColor = colors.fileVideo;
  else if (mimeType === 'application' && extension === 'pdf')
    iconColor = '#F44336';
  else if (mimeType === 'application' && extension.includes('sheet'))
    iconColor = colors.fileSpreadsheet;
  else if (mimeType === 'application' && extension.includes('document'))
    iconColor = colors.fileDocument;
  else if (mimeType === 'text') iconColor = colors.fileDocument;

  const iconStyle = {
    fontSize: 24,
    color: '#FFF',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const iconContainerStyle = {
    width: 36,
    height: 36,
    borderRadius: '8px',
    backgroundColor: iconColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '10px',
  };

  switch (mimeType) {
    case 'text':
      if (extension === 'owlnote')
        return (
          <Typography sx={{ fontSize: 30, marginRight: '10px' }}>🦉</Typography>
        );
      else
        return <DescriptionIcon sx={{ fontSize: 30, marginRight: '10px' }} />;

    case 'application':
      if (extension === 'pdf')
        return (
          <Box sx={iconContainerStyle}>
            <PictureAsPdfIcon sx={iconStyle} />
          </Box>
        );
      else if (extension.includes('sheet') || extension === 'csv')
        return (
          <Box sx={iconContainerStyle}>
            <TableChartIcon sx={iconStyle} />
          </Box>
        );
      else if (
        extension.includes('document') ||
        extension === 'docx' ||
        extension === 'doc'
      )
        return (
          <Box sx={iconContainerStyle}>
            <DescriptionIcon sx={iconStyle} />
          </Box>
        );
      return (
        <Box sx={iconContainerStyle}>
          <InsertDriveFileIcon sx={iconStyle} />
        </Box>
      );
    case 'image':
      return (
        <Box sx={iconContainerStyle}>
          <ImageIcon sx={iconStyle} />
        </Box>
      );
    case 'audio':
      return (
        <Box sx={iconContainerStyle}>
          <MusicNoteIcon sx={iconStyle} />
        </Box>
      );
    case 'video':
      return (
        <Box sx={iconContainerStyle}>
          <MovieIcon sx={iconStyle} />
        </Box>
      );
    default:
      return (
        <Box sx={iconContainerStyle}>
          <InsertDriveFileIcon sx={iconStyle} />
        </Box>
      );
  }
};

// Location icon for folder
const getFolderLocationIcon = (isHome: boolean) => {
  if (isHome) {
    return (
      <HomeIcon 
        sx={{ 
          color: colors.fileGray, 
          fontSize: 20, 
          marginRight: 1 
        }} 
      />
    );
  }
  
  return (
    <FolderIcon 
      sx={{ 
        color: colors.fileGray, 
        fontSize: 20, 
        marginRight: 1 
      }} 
    />
  );
};

// Helper function to get folder name by ID - this function will make an API call
const getFolderNameById = async (folderId: string): Promise<string> => {
  try {
    const response = await axios.get(
      `${process.env.REACT_APP_API_BASE_URL}/api/folder/${folderId}`,
      { withCredentials: true }
    );
    
    if (response.data && response.data.name) {
      return response.data.name;
    }
    
    return 'Unknown folder';
  } catch (error) {
    console.error('Error fetching folder name:', error);
    return 'Unknown folder';
  }
};

const FileComponent = (props: FileComponentProps) => {
  const { userId } = useUser(); // Add this to get the current user ID
  const [ownerUserName, setOwnerUserName] = useState<string>('Loading...');
  const [modifiedByName, setModifiedByName] = useState<string>('N/A');
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const fileCache = useRef(new Map<string, string>());
  const [isFavorited, setIsFavorited] = useState(false);
  const { fetchStorageUsed } = useStorage();
  const [isShared, setIsShared] = useState(false);
  
  // State for the parent folder name (for location column)
  const [folderName, setFolderName] = useState<string>('Home');
  const [isLoadingFolderName, setIsLoadingFolderName] = useState(false);

  // For the image viewer
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [fileSrc, setFileSrc] = useState('');

  const [error, setError] = useState<string | null>(null);

  const isEditSupported = isSupportedFileTypeText(props.file.fileType);

  const [, setCurrentPermission] = useState<Permission | null>(null);

  // Fetch parent folder name if showing location
  useEffect(() => {
    if (!props.showLocation) return;
    
    const fetchFolderName = async () => {
      if (!props.file.parentFolder) {
        setFolderName('Home');
        return;
      }
      
      setIsLoadingFolderName(true);
      try {
        const name = await getFolderNameById(props.file.parentFolder);
        setFolderName(name || 'Unknown folder');
      } catch (err) {
        console.error('Error fetching folder name:', err);
        setFolderName('Unknown folder');
      } finally {
        setIsLoadingFolderName(false);
      }
    };

    fetchFolderName();
  }, [props.file.parentFolder, props.showLocation]);

  // Check if the file is shared with others
  useEffect(() => {
    const checkIfShared = async () => {
      try {
        const permissions = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/file/${props.file.id}/permissions`,
          { withCredentials: true }
        );
        
        // If there are permissions for other users, the file is shared
        const sharedWithOthers = Array.isArray(permissions.data) && permissions.data.some(
          (perm) => perm.userId !== userId && !perm.deletedAt
        );
        
        setIsShared(sharedWithOthers);
      } catch (error) {
        console.error('Error checking if file is shared:', error);
        setIsShared(false);
      }
    };

    // Only check if this is the user's own file
    if (props.file.owner === userId && props.page !== 'shared') {
      checkIfShared();
    }
  }, [props.file.id, props.file.owner, userId, props.page]);

  useEffect(() => {
    const fetchPermission = async () => {
      if (props.page === 'shared') {
        const permission = await getPermissionByFileId(props.file.id);
        if (permission) {
          setCurrentPermission(permission);
        }
      }
    };

    fetchPermission();
  }, [props.page, props.file.id]);
  const getMenuItems = () => {
    if (props.page === 'trash') {
      return (
        <MenuItem onClick={handleRestoreClick}>
          <RestoreIcon sx={{ fontSize: '20px', marginRight: '9px' }} /> Restore
        </MenuItem>
      );
    }

    const menuItems = [];

    if (isEditSupported) {
      menuItems.push(
        <MenuItem key="edit" onClick={handleEditClick}>
          <EditNoteIcon sx={{ fontSize: '20px', marginRight: '9px' }} /> Edit
        </MenuItem>,
        <Divider key="divider-edit" sx={{ my: 0.2 }} />,
      );
    }

    // Share
    menuItems.push(
      <MenuItem key="share" onClick={handlePermissionsClick}>
        <SendIcon sx={{ fontSize: '20px', marginRight: '9px' }} /> Share
      </MenuItem>,
      <Divider key="divider-share" sx={{ my: 0.2 }} />,
    );

    // Rename
    menuItems.push(
      <MenuItem key="rename" onClick={handleRenameClick}>
        <DriveFileRenameOutlineIcon
          sx={{ fontSize: '20px', marginRight: '9px' }}
        />{' '}
        Rename
      </MenuItem>,
      <Divider key="divider-rename" sx={{ my: 0.2 }} />,
    );

    // Delete (only in home & favorites)
    if (props.page === 'home' || props.page === 'favorites') {
      menuItems.push(
        <MenuItem key="delete" onClick={handleDeleteClick}>
          <DeleteIcon sx={{ fontSize: '20px', marginRight: '9px' }} /> Delete
        </MenuItem>,
        <Divider key="divider-delete" sx={{ my: 0.2 }} />,
      );
    }

    // Download
    menuItems.push(
      <MenuItem
        key="download"
        onClick={() => {
          downloadFile(props.file.id, props.file.name);
          handleOptionsClose();
        }}
      >
        <InsertDriveFileIcon sx={{ fontSize: '20px', marginRight: '9px' }} />{' '}
        Download
      </MenuItem>,
      <Divider key="divider-download" sx={{ my: 0.2 }} />,
    );

    // Move (shared, home)
    if (props.page !== 'favorites') {
      menuItems.push(
        <MenuItem key="move" onClick={handleMoveClick}>
          <DriveFileMove sx={{ fontSize: '20px', marginRight: '9px' }} /> Move
        </MenuItem>,
      );
    }

    return menuItems;
  };
  useEffect(() => {
    const fetchOwnerUserName = async () => {
      if (props.file.owner) {
        try {
          const username = await getUsernameById(props.file.owner);
          setOwnerUserName(username || 'Unknown');
        } catch (error) {
          console.error('Error fetching username:', error);
          setError(`Error fetching owner username: ${error}`);
          setOwnerUserName('Unknown');
        }
      }
    };
    fetchOwnerUserName();
  }, [props.file.owner]);

  useEffect(() => {
    const fetchModifiedByName = async () => {
      // If this is the user's own file and not shared, set the modifier to the owner
      if (props.file.owner === userId && !isShared) {
        setModifiedByName(ownerUserName);
        return;
      }
      
      // Otherwise, proceed with normal logic
      if (!props.file.lastModifiedBy) {
        setModifiedByName('N/A');
        return;
      }

      try {
        const username = await getUsernameById(props.file.lastModifiedBy);
        setModifiedByName(username || 'Unknown');
      } catch (error) {
        console.error('Error fetching modified by username:', error);
        setError('Error fetching modified by username');
        setModifiedByName('Unknown');
      }
    };

    fetchModifiedByName();
  }, [props.file.lastModifiedBy, userId, props.file.owner, ownerUserName, isShared]);

  useEffect(() => {
    const fetchIsFavorited = async () => {
      try {
        const isFavorited = await getIsFavoritedByFileId(props.file.id);
        setIsFavorited(isFavorited);
      } catch (error) {
        console.error('Error fetching isFavorited for file', error);
        setError('Error fetching isFavorited for file');
      }
    };

    fetchIsFavorited();
  }, [props.file.id]);

  const open = Boolean(anchorEl);

  const handleFileClick = async () => {
    if (
      props.file.fileType.startsWith('image/') ||
      props.file.fileType.startsWith('application/pdf') ||
      props.file.fileType.startsWith('audio/') ||
      isSupportedFileTypeVideo(props.file.fileType) ||
      isSupportedFileTypeText(props.file.fileType)
    ) {
      setIsFileViewerOpen(true); // Open the modal immediately

      if (fileCache.current.has(props.file.gcsKey)) {
        setFileSrc(fileCache.current.get(props.file.gcsKey) as string);
        return;
      }

      try {
        const blob = await getBlobGcskey(
          props.file.gcsKey,
          props.file.fileType,
          props.file.id,
        );
        const objectUrl = URL.createObjectURL(blob);
        if (!isSupportedFileTypeText(props.file.fileType)) {
          fileCache.current.set(props.file.gcsKey, objectUrl);
        }
        setFileSrc(objectUrl);
      } catch (err) {
        console.error('Error fetching file from server:', err);
        setError('Error fetching file');
      }
    }
  };

  const handleCloseFileViewer = () => {
    setIsFileViewerOpen(false);
  };

  const handleCloseEditor = () => {
    setIsEditDialogOpen(false);
  };

  const handleOptionsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleOptionsClose = () => {
    setAnchorEl(null);
  };

  // DELETE Event Handlers
  const handleDeleteClick = async (event: React.MouseEvent) => {
    event.stopPropagation();
    await handleDeleteFile(props.file.id);
    setAnchorEl(null);
    props.refreshFiles(props.file.parentFolder);
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_BASE_URL}/api/file/${fileId}/delete`,
        {
          withCredentials: true,
        },
      );
      await fetchStorageUsed();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  // FAVORITE Event Handlers
  const handleFavoriteFileClick = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (props.page === 'trash') {
      alert('Restore the file to update it!');
    } else {
      await handleFavoriteFile(props.file.id);
      setIsFavorited(!isFavorited); // toggle state locally
    }
    props.refreshFiles(props.file.parentFolder);
  };

  const handleFavoriteFile = async (fileId: string) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/api/file/${fileId}/favorite`,
        {},
        { withCredentials: true },
      );
    } catch (error) {
      console.error('Error favoriting file:', error);
    }
  };

  // RESTORE Event Handlers
  const handleRestoreClick = async (event: React.MouseEvent) => {
    event.stopPropagation();
    await handleRestoreFile(props.file.id, props.file.owner);
    setAnchorEl(null);

    if (props.page === 'trash') {
      props.refreshFiles(null);
    } else {
      props.refreshFiles(props.file.parentFolder);
    }
  };

  const handleRestoreFile = async (fileId: string, owner: string) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/api/file/${fileId}/restore`,
        {},
        { withCredentials: true },
      );
    } catch (error) {
      console.error('Error restoring file:', error);
    }
  };

  const handleSaveOwlNote = async (fileId: string, content: string) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/api/file/save/owlnote/${fileId}`,
        { content },
        { withCredentials: true },
      );
    } catch (error) {
      console.error('Error saving owl text content', error);
    }
    props.refreshFiles(props.file.parentFolder);
  };

  const handleRenameClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsRenameDialogOpen(true);
    handleOptionsClose();
  };

  const handlePermissionsClick = () => {
    setIsPermissionsDialogOpen(true);
    handleOptionsClose();
  };

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
    handleOptionsClose();
  };

  const handleMoveClick = () => {
    setIsMoveDialogOpen(true);
    handleOptionsClose();
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return 'Unknown';
    }

    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return '1 day ago';
    } else if (diffDays < 31) {
      return `${diffDays} days ago`;
    } else if (diffDays < 60) {
      return '1 month ago';
    } else {
      return `${Math.floor(diffDays / 30)} months ago`;
    }
  };

  // Helper function to format time as HH:MM AM/PM
  const formatTimeStamp = (dateString: string | Date) => {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return '00:00';
    }
    
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12 hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    return `${hours}:${minutes} ${ampm}`;
  };

  const lastModifiedDate = formatDate(props.file.lastModifiedAt);
  const createdDate = formatDate(props.file.createdAt);

  // Helper function to render the avatar
  const renderAvatar = (name: string) => {
    // Get avatar color dynamically based on name
    const avatarColor = getAvatarColor(name);
    
    // For N/A case, show a different placeholder
    if (name === 'N/A') {
      return (
        <Avatar sx={{ ...avatarStyles.small, bgcolor: '#9E9E9E', marginRight: 1 }}>
          -
        </Avatar>
      );
    }
    
    return (
      <Avatar
        sx={{
          ...avatarStyles.small,
          bgcolor: avatarColor,
          marginRight: 1,
        }}
      >
        {name.charAt(0).toUpperCase()}
      </Avatar>
    );
  };

  return (
    <>
      <TableRow
        sx={{
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
          borderBottom: `1px solid ${colors.divider}`,
        }}
        onClick={() => {
          if (props.page !== 'trash') handleFileClick();
        }}
      >
        {/* File Icon and Name */}
        <TableCell
          sx={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: 'none',
          }}
        >
          {getFileIcon(props.file.fileType)}
          <Tooltip title={props.file.name} arrow>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 500,
                maxWidth: '250px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {props.file.name}
            </Typography>
          </Tooltip>
        </TableCell>

        {/* Location Column - Only shown when showLocation is true */}
        {props.showLocation && (
          <TableCell
            sx={{
              padding: '12px 16px',
              borderBottom: 'none',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {getFolderLocationIcon(folderName === 'Home')}
              <Tooltip title={folderName} arrow>
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
                  {isLoadingFolderName ? 'Loading...' : folderName}
                </Typography>
              </Tooltip>
            </Box>
          </TableCell>
        )}

        {/* Created Date */}
        <TableCell sx={{ borderBottom: 'none' }}>
          <Typography variant="body2" color="text.secondary">
            {createdDate}
          </Typography>
        </TableCell>

        {/* Owner */}
        <TableCell sx={{ borderBottom: 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {renderAvatar(ownerUserName)}
            <Typography variant="body2" color="text.secondary">
              {ownerUserName}
            </Typography>
          </Box>
        </TableCell>

        {/* Combined Last Modified and Modified By - without avatar */}
        <TableCell sx={{ borderBottom: 'none' }}>
          <Typography variant="body2" color="text.secondary">
            {lastModifiedDate === 'Today' 
              ? `Today at ${formatTimeStamp(props.file.lastModifiedAt)} by ${modifiedByName}`
              : `${lastModifiedDate} by ${modifiedByName}`}
          </Typography>
        </TableCell>

        {/* Actions */}
        <TableCell align="right" sx={{ borderBottom: 'none' }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton
              onClick={handleFavoriteFileClick}
              size="small"
              sx={{
                color: isFavorited ? '#FF6347' : colors.textSecondary,
              }}
            >
              {isFavorited ? (
                <FavoriteIcon fontSize="small" />
              ) : (
                <FavoriteBorderIcon fontSize="small" />
              )}
            </IconButton>

            <IconButton
              onClick={handleOptionsClick}
              size="small"
              sx={{ color: colors.textSecondary }}
            >
              <MoreHorizIcon fontSize="small" />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClick={(event) => event.stopPropagation()}
        onClose={handleOptionsClose}
        PaperProps={{
          sx: {
            width: '180px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            borderRadius: '8px',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {getMenuItems()}
      </Menu>

      <RenameDialog
        open={isRenameDialogOpen}
        resourceName={props.file.name}
        resourceId={props.file.id}
        resourceType="file"
        onClose={() => setIsRenameDialogOpen(false)}
        onSuccess={() => props.refreshFiles(props.file.parentFolder)}
      />

      <PermissionDialog
        open={isPermissionsDialogOpen}
        onClose={() => setIsPermissionsDialogOpen(false)}
        fileId={props.file.id}
        folderId={null}
      />

      {isEditDialogOpen && (
        <>
          {props.file.fileType === 'text/owlnote' ? (
            <OwlNoteEditorDialog
              open={isEditDialogOpen}
              onClose={handleCloseEditor}
              onOwlNoteSave={handleSaveOwlNote}
              fileId={props.file.id}
              gcsKey={props.file.gcsKey}
              fileType={props.file.fileType}
              parentFolder={props.file.parentFolder}
              fileName={props.file.name}
            />
          ) : (
            <TextEditor
              fileId={props.file.id}
              gcsKey={props.file.gcsKey}
              mimeType={props.file.fileType}
              open={isEditDialogOpen}
              onClose={handleCloseEditor}
            />
          )}
        </>
      )}

      <Modal open={isFileViewerOpen} onClose={handleCloseFileViewer}>
        <Fade in={isFileViewerOpen} timeout={300}>
          <Box>
            <FileViewerDialog
              open={isFileViewerOpen}
              onClose={handleCloseFileViewer}
              src={fileSrc}
              fileType={props.file.fileType}
              fileName={props.file.name}
            />
            {error && (
              <ErrorAlert
                open={!!error}
                message={error}
                onClose={() => setError(null)}
              />
            )}
          </Box>
        </Fade>
      </Modal>

      <MoveDialog
        open={isMoveDialogOpen}
        onClose={() => setIsMoveDialogOpen(false)}
        page={props.page}
        resourceName={props.file.name}
        resourceId={props.file.id}
        resourceType="file"
        parentFolderId={props.file.parentFolder}
        onSuccess={() => props.refreshFiles(props.file.parentFolder)}
      />
    </>
  );
};

export default FileComponent;