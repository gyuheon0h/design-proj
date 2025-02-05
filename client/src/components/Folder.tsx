import React, { useState } from 'react';
import SendIcon from '@mui/icons-material/Send';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import Divider from '@mui/material/Divider';
import { Box, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { colors } from '../Styles';

export interface FolderProp {
  id: string;
  name: string;
  owner: string;
  createdAt: Date;
  parentFolder: string | null;
  folderChildren: string[];
  fileChildren: string[];
  onClick: (folder: FolderProp) => void;
  onFolderDelete: (folderId: string) => Promise<void>;
}

const Folder = (prop: FolderProp) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [favorited, setFavorited] = useState(false);
  const open = Boolean(anchorEl);

  const handleOptionsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleOptionsClose = (event: React.MouseEvent) => {
    event.stopPropagation();
    setAnchorEl(null);
  };

  const handleFolderClick = () => {
    prop.onClick(prop);
  };

  const toggleFavorite = (event: React.MouseEvent) => {
    event.stopPropagation(); // idk why but i feel like this is necessary
    setFavorited((prev) => !prev);
  };

  return (
    <Box
      className="folder"
      data-folder-id={prop.id}
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
      {/* Folder Tab (Back Piece) */}
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
          {prop.name}
        </Typography>

        {/* Favorites ❤️ */}
        <IconButton
          onClick={toggleFavorite}
          sx={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            color: favorited ? '#FF6347' : colors.darkBlue,
          }}
        >
          {favorited ? <FavoriteIcon /> : <FavoriteBorderIcon />}
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
          <MenuItem
            onClick={handleOptionsClose}
            sx={{
              color: colors.darkBlue,
              paddingRight: '16px',
              '&:hover': {
                backgroundColor: '#e0f2ff',
              },
              '&.Mui-selected': {
                backgroundColor: '#dce9ff',
                borderColor: colors.darkBlue,
              },
            }}
          >
            <SendIcon
              sx={{
                color: colors.darkBlue,
                fontSize: '20px',
                marginRight: '9px',
              }}
            />
            Share
          </MenuItem>

          <Divider sx={{ my: 0.2, color: colors.darkBlue }} />

          <MenuItem
            onClick={handleOptionsClose}
            sx={{
              color: colors.darkBlue,
              paddingRight: '16px',
              '&:hover': {
                backgroundColor: '#e0f2ff',
              },
              '&.Mui-selected': {
                backgroundColor: '#dce9ff',
                borderColor: colors.darkBlue,
              },
            }}
          >
            <DriveFileRenameOutlineIcon
              sx={{
                color: colors.darkBlue,
                fontSize: '20px',
                marginRight: '9px',
              }}
            />
            Rename
          </MenuItem>

          <Divider sx={{ my: 0.2, color: colors.darkBlue }} />

          <MenuItem
            onClick={(e) => {
              handleOptionsClose(e);
              prop.onFolderDelete(prop.id);
            }}
            sx={{
              color: colors.darkBlue,
              paddingRight: '16px',
              '&:hover': {
                backgroundColor: '#e0f2ff',
              },
              '&.Mui-selected': {
                backgroundColor: '#dce9ff',
                borderColor: colors.darkBlue,
              },
            }}
          >
            <DeleteIcon
              sx={{
                color: colors.darkBlue,
                fontSize: '20px',
                marginRight: '9px',
              }}
            />
            Delete
          </MenuItem>

          <Divider sx={{ my: 0.2, color: colors.darkBlue }} />

          <MenuItem
            onClick={handleOptionsClose}
            sx={{
              color: colors.darkBlue,
              paddingRight: '16px',
              '&:hover': {
                backgroundColor: '#e0f2ff',
              },
              '&.Mui-selected': {
                backgroundColor: '#dce9ff',
                borderColor: colors.darkBlue,
              },
            }}
          >
            <UploadIcon
              sx={{
                color: colors.darkBlue,
                fontSize: '20px',
                marginRight: '9px',
              }}
            />
            Upload
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default Folder;
