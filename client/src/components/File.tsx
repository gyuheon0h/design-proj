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
  Modal,
  Fade,
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
import RenameDialog from './RenameDialog';
import {
  getUsernameById,
  downloadFile,
  getBlobGcskey,
  getIsFavoritedByFileId,
  getPermissionByFileId,
} from '../utils/helperRequests';
import PermissionDialog from './PermissionsDialog';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FileViewerDialog from './FileViewerDialog';
import { colors } from '../Styles';
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

export interface FileComponentProps {
  page: 'home' | 'shared' | 'favorites' | 'trash';
  file: File;
  refreshFiles: (folderId: string | null) => void;
}

const getFileIcon = (fileType: string) => {
  const lowerCaseType = fileType.trim().toLowerCase();
  const [mimeType, subtype] = lowerCaseType.split('/');

  switch (mimeType) {
    case 'text':
      switch (subtype) {
        case 'owlnote':
          return (
            <Typography sx={{ fontSize: 30, marginRight: '10px' }}>
              🦉
            </Typography>
          );
        default:
          return <DescriptionIcon sx={{ fontSize: 30, marginRight: '10px' }} />;
      }
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
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const fileCache = useRef(new Map<string, string>());
  const [isFavorited, setIsFavorited] = useState(false);

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
  }, [props.file.id, props.page]);

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
    setAnchorEl(event.currentTarget);
  };

  const handleOptionsClose = () => {
    setAnchorEl(null);
  };

  // DELETE Event Handlers
  const handleDeleteClick = async (event: React.MouseEvent) => {
    event.stopPropagation();
    await handleDeleteFile(props.file.id);
    setAnchorEl(null); //TODO: figure out whether to use this or handleOptionsClose()
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
    // Note: still calling the patch through the file endpoint, but it's using the permission model
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
    // const ownerUsername = await getUsernameById(owner);

    // TODO: see comment in FolderComponent
    // if (ownerUsername !== username) {
    //   alert('You do not have permission to restore this file.');
    //   return;
    // }
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
    props.refreshFiles(props.file.parentFolder);
  };

  const handlePermissionsClick = () => {
    setIsPermissionsDialogOpen(true);
    handleOptionsClose();
    // props.refreshFiles(props.file.parentFolder);
  };

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
    handleOptionsClose();
  };

  const handleMoveClick = () => {
    setIsMoveDialogOpen(true);
    handleOptionsClose();
    props.refreshFiles(props.file.parentFolder);
  };

  const lastModifiedDate = new Date(props.file.lastModifiedAt);
  const formattedLastModifiedDate = !isNaN(lastModifiedDate.getTime())
    ? lastModifiedDate.toLocaleDateString()
    : 'Unknown';

  const createdDate = new Date(props.file.createdAt);
  const formattedCreatedDate = !isNaN(createdDate.getTime())
    ? lastModifiedDate.toLocaleDateString()
    : 'Unknown';

  const dateText = props.file.lastModifiedBy
    ? `Last Modified: ${formattedLastModifiedDate} by ${modifiedByName || ownerUserName}`
    : `Created: ${formattedCreatedDate} by ${ownerUserName}`;

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
          if (props.page !== 'trash') handleFileClick();
        }}
      >
        {getFileIcon(props.file.fileType)}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '3fr 2fr 2fr',
            alignItems: 'center',
            flexGrow: 1,
            overflow: 'hidden',
            gap: '20px',
          }}
        >
          <Tooltip title={props.file.name} arrow>
            <Typography
              variant="subtitle1"
              sx={{
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {props.file.name}
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

          <Tooltip title={dateText} arrow>
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
              {dateText}
            </Typography>
          </Tooltip>
        </Box>

        {/* Favorites Toggle Button */}
        <IconButton
          onClick={handleFavoriteFileClick}
          sx={{
            color: isFavorited ? '#FF6347' : colors.darkBlue,
          }}
        >
          {isFavorited ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        </IconButton>

        <IconButton
          onClick={(e) => {
            handleOptionsClick(e);
            e.stopPropagation();
          }}
        >
          <MoreHorizIcon />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClick={(event) => event.stopPropagation()}
          onClose={handleOptionsClose}
          PaperProps={{
            sx: {
              width: '150px',
            },
          }}
        >
          {props.page === 'trash' ? (
            <MenuItem onClick={handleRestoreClick}>
              <RestoreIcon sx={{ fontSize: '20px', marginRight: '9px' }} />{' '}
              Restore
            </MenuItem>
          ) : props.page === 'shared' ? (
            [
              currentPermission?.role === 'editor' && isEditSupported ? (
                <MenuItem onClick={handleEditClick}>
                  <EditNoteIcon sx={{ fontSize: '20px', marginRight: '9px' }} />
                  Edit
                </MenuItem>
              ) : null,
              <MenuItem
                onClick={() => {
                  downloadFile(props.file.id, props.file.name);
                  handleOptionsClose();
                }}
              >
                <InsertDriveFileIcon
                  sx={{ fontSize: '20px', marginRight: '9px' }}
                />{' '}
                Download
              </MenuItem>,
            ]
          ) : (
            [
              isEditSupported
                ? [
                    <MenuItem onClick={handleEditClick}>
                      <EditNoteIcon
                        sx={{ fontSize: '20px', marginRight: '9px' }}
                      />
                      Edit
                    </MenuItem>,
                    <Divider sx={{ my: 0.2 }} />,
                  ]
                : null,

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

              <MenuItem onClick={handleDeleteClick}>
                <DeleteIcon sx={{ fontSize: '20px', marginRight: '9px' }} />{' '}
                Delete
              </MenuItem>,

              <Divider sx={{ my: 0.2 }} />,

              <MenuItem
                onClick={() => {
                  downloadFile(props.file.id, props.file.name);
                  handleOptionsClose();
                }}
              >
                <InsertDriveFileIcon
                  sx={{ fontSize: '20px', marginRight: '9px' }}
                />{' '}
                Download
              </MenuItem>,

              <Divider sx={{ my: 0.2 }} />,

              <MenuItem onClick={handleMoveClick}>
                <DriveFileMove sx={{ fontSize: '20px', marginRight: '9px' }} />{' '}
                Move
              </MenuItem>,
            ]
          )}
        </Menu>
      </Card>

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

      {/* necessary to only open one websocket at a time */}
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
    </div>
  );
};

export default FileComponent;
