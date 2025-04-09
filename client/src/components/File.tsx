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
import DriveFileMove from '@mui/icons-material/DriveFileMove';
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
import { permission } from 'process';
import { useStorage } from '../context/StorageContext';

export interface FileComponentProps {
  page: 'home' | 'shared' | 'favorites' | 'trash';
  file: File;
  refreshFiles: (folderId: string | null) => void;
}

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
      return (
        <Box sx={iconContainerStyle}>
          <DescriptionIcon sx={iconStyle} />
        </Box>
      );
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

const FileComponent = (props: FileComponentProps) => {
  const [ownerUserName, setOwnerUserName] = useState<string>('Loading...');
  const [modifiedByName, setModifiedByName] = useState<string>('Loading...');
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const fileCache = useRef(new Map<string, string>());
  const [isFavorited, setIsFavorited] = useState(false);
  const { fetchStorageUsed } = useStorage();

  // For the image viewer
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [fileSrc, setFileSrc] = useState('');

  const [error, setError] = useState<string | null>(null);

  const [currentPermission, setCurrentPermission] = useState<Permission | null>(
    null,
  );

  const isEditSupported = isSupportedFileTypeText(props.file.fileType);

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
      if (props.file.lastModifiedBy) {
        try {
          const username = await getUsernameById(props.file.lastModifiedBy);
          setModifiedByName(username || 'Unknown');
        } catch (error) {
          console.error('Error fetching username:', error);
          setError('Error fetching username');
          setModifiedByName('Unknown');
        }
      }
    };

    fetchModifiedByName();
  }, [props.file.lastModifiedBy]);

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
    props.refreshFiles(props.file.parentFolder);
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

  const lastModifiedDate = formatDate(props.file.lastModifiedAt);
  const createdDate = formatDate(props.file.createdAt);

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

        {/* Created Date */}
        <TableCell sx={{ borderBottom: 'none' }}>
          <Typography variant="body2" color="text.secondary">
            {createdDate}
          </Typography>
        </TableCell>

        {/* Owner */}
        <TableCell sx={{ borderBottom: 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{
                ...avatarStyles.small,
                bgcolor:
                  ownerUserName === 'Sarah Luan'
                    ? '#F44336'
                    : ownerUserName === 'Emily Yang'
                      ? '#673AB7'
                      : ownerUserName === 'Jake Lehrman'
                        ? '#FF9800'
                        : ownerUserName === 'Ethan Hsu'
                          ? '#607D8B'
                          : ownerUserName === 'Henry Pu'
                            ? '#FF9800'
                            : colors.avatar,
                marginRight: 1,
              }}
            >
              {ownerUserName.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              {ownerUserName}
            </Typography>
          </Box>
        </TableCell>

        {/* Last Modified */}
        <TableCell sx={{ borderBottom: 'none' }}>
          <Typography variant="body2" color="text.secondary">
            {lastModifiedDate}
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
        {props.page === 'trash' ? (
          <MenuItem onClick={handleRestoreClick} key="restore">
            <RestoreIcon sx={{ fontSize: '20px', marginRight: '9px' }} />{' '}
            Restore
          </MenuItem>
        ) : props.page === 'shared' ? (
          [
            currentPermission?.role === 'editor' && isEditSupported && (
              <MenuItem onClick={handleEditClick} key="edit">
                <EditNoteIcon sx={{ fontSize: '20px', marginRight: '9px' }} />{' '}
                Edit
              </MenuItem>
            ),
            <MenuItem
              onClick={() => {
                downloadFile(props.file.id, props.file.name);
                handleOptionsClose();
              }}
              key="download"
            >
              <InsertDriveFileIcon
                sx={{ fontSize: '20px', marginRight: '9px' }}
              />{' '}
              Download
            </MenuItem>,
          ]
        ) : (
          [
            isEditSupported && (
              <MenuItem onClick={handleEditClick} key="edit">
                <EditNoteIcon sx={{ fontSize: '20px', marginRight: '9px' }} />{' '}
                Edit
              </MenuItem>
            ),
            <MenuItem onClick={handlePermissionsClick} key="share">
              <SendIcon sx={{ fontSize: '20px', marginRight: '9px' }} /> Share
            </MenuItem>,
            <MenuItem onClick={handleRenameClick} key="rename">
              <DriveFileRenameOutlineIcon
                sx={{ fontSize: '20px', marginRight: '9px' }}
              />{' '}
              Rename
            </MenuItem>,
            <MenuItem onClick={handleMoveClick} key="move">
              <DriveFileMove sx={{ fontSize: '20px', marginRight: '9px' }} />{' '}
              Move
            </MenuItem>,
            <MenuItem
              onClick={() => {
                downloadFile(props.file.id, props.file.name);
                handleOptionsClose();
              }}
              key="download"
            >
              <InsertDriveFileIcon
                sx={{ fontSize: '20px', marginRight: '9px' }}
              />{' '}
              Download
            </MenuItem>,
            <Divider key="divider" />,
            <MenuItem
              onClick={handleDeleteClick}
              sx={{ color: '#FF6347' }}
              key="delete"
            >
              <DeleteIcon
                sx={{ fontSize: '20px', marginRight: '9px', color: '#FF6347' }}
              />{' '}
              Delete
            </MenuItem>,
          ]
        )}
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
        <TextEditor
          fileId={props.file.id}
          gcsKey={props.file.gcsKey}
          mimeType={props.file.fileType}
          open={isEditDialogOpen}
          onClose={handleCloseEditor}
        />
      )}

      <Modal open={isFileViewerOpen} onClose={handleCloseFileViewer}>
        <Fade in={isFileViewerOpen} timeout={300}>
          <Box>
            <FileViewerDialog
              open={isFileViewerOpen}
              onClose={handleCloseFileViewer}
              src={fileSrc}
              fileType={props.file.fileType}
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