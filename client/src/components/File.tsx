import React, { useEffect, useState } from 'react';
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
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import MovieIcon from '@mui/icons-material/Movie';
import TableChartIcon from '@mui/icons-material/TableChart';
import {
  getUsernameById,
  downloadFile,
} from '../miscellHelpers/helperRequests';

interface File {
  id: string;
  name: string;
  owner: string; // THIS IS UUID
  createdAt: Date;
  lastModifiedBy: string | null;
  lastModifiedAt: Date;
  parentFolder: string | null;
  gcsKey: string;
  fileType: string;
  handleDeleteFile: (fileId: string) => void;
}

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'csv':
      return <TableChartIcon sx={{ fontSize: 30, marginRight: '10px' }} />;
    case 'txt':
      return <DescriptionIcon sx={{ fontSize: 30, marginRight: '10px' }} />;
    case 'pdf':
      return (
        <InsertDriveFileIcon
          sx={{ fontSize: 30, marginRight: '10px', color: 'red' }}
        />
      );
    case 'photo':
      return <ImageIcon sx={{ fontSize: 30, marginRight: '10px' }} />;
    case 'mp3':
      return <MusicNoteIcon sx={{ fontSize: 30, marginRight: '10px' }} />;
    case 'mp4':
      return <MovieIcon sx={{ fontSize: 30, marginRight: '10px' }} />;
    default:
      return <InsertDriveFileIcon sx={{ fontSize: 30, marginRight: '10px' }} />;
  }
};

const FileComponent = (props: File) => {
  const [ownerUserName, setOwnerUserName] = useState<string>('Loading...');
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
  }, [props.owner]); // Runs effect when `props.owner` changes need to do this bc react tsx needs to render synchronously

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOptionsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleOptionsClose = () => {
    setAnchorEl(null);
  };

  const lastModifiedDate = new Date(props.lastModifiedAt);
  const formattedLastModifiedDate = !isNaN(lastModifiedDate.getTime())
    ? lastModifiedDate.toLocaleDateString()
    : 'Unknown';

  return (
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
          title={`Last Modified: ${formattedLastModifiedDate} by ${props.lastModifiedBy || ownerUserName}`}
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
            {props.lastModifiedBy || ownerUserName}
          </Typography>
        </Tooltip>
      </Box>

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
        <MenuItem onClick={handleOptionsClose}>
          <SendIcon sx={{ fontSize: '20px', marginRight: '9px' }} /> Share
        </MenuItem>

        <Divider sx={{ my: 0.2 }} />

        <MenuItem onClick={handleOptionsClose}>
          <DriveFileRenameOutlineIcon
            sx={{ fontSize: '20px', marginRight: '9px' }}
          />{' '}
          Rename
        </MenuItem>

        <Divider sx={{ my: 0.2 }} />

        <MenuItem
          onClick={() => {
            props.handleDeleteFile(props.id);
            handleOptionsClose();
          }}
        >
          <DeleteIcon sx={{ fontSize: '20px', marginRight: '9px' }} /> Delete
        </MenuItem>

        <Divider sx={{ my: 0.2 }} />

        <MenuItem
          onClick={() => {
            downloadFile(props.id, props.name);
            handleOptionsClose();
          }}
        >
          <InsertDriveFileIcon sx={{ fontSize: '20px', marginRight: '9px' }} />{' '}
          Download
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default FileComponent;
