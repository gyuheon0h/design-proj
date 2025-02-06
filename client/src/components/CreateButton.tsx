import React, { useState } from 'react';
import { Fab, Menu, MenuItem } from '@mui/material';
import axios from 'axios';
import UploadDialog from './CreateFileDialog';
import FolderDialog from './CreateFolderDialog';
import AddIcon from '@mui/icons-material/Add';

interface CreateButtonProps {
  currentFolderId: string | null;
  refresh: (folderId: string | null) => void;
}

const CreateButton: React.FC<CreateButtonProps> = ({
  currentFolderId,
  refresh,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const openFolderDialog = () => {
    setFolderDialogOpen(true);
  };

  const closeFolderDialog = () => {
    setFolderDialogOpen(false);
  };

  const openUploadDialog = () => {
    setUploadDialogOpen(true);
  };

  const closeUploadDialog = () => {
    setUploadDialogOpen(false);
  };

  const handleUploadFile = async (file: Blob, fileName: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', fileName);

    if (currentFolderId) {
      formData.append('parentFolder', currentFolderId);
    }

    try {
      const response = await axios.post(
        'http://localhost:5001/api/file/upload',
        formData,
        { withCredentials: true },
      );
      refresh(currentFolderId);
      return response.data;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  const handleCreateFolder = async (
    folderName: string,
    parentFolder: string | null,
  ) => {
    const requestBody = { name: folderName, parentFolder };
    try {
      const response = await axios.post(
        'http://localhost:5001/api/folder/create',
        requestBody,
        { withCredentials: true },
      );
      refresh(currentFolderId);
      return response.data;
    } catch (error) {
      console.error('Folder creation failed:', error);
      throw error;
    }
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="create"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          position: 'fixed',
          bottom: '48px',
          right: '48px',
          width: 72,
          height: 72,
        }}
      >
        <AddIcon />
      </Fab>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            handleMenuClose();
            openFolderDialog();
          }}
        >
          Create a Folder
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            openUploadDialog();
          }}
        >
          Upload a File
        </MenuItem>
      </Menu>

      <FolderDialog
        open={folderDialogOpen}
        onClose={closeFolderDialog}
        currentFolderId={currentFolderId}
        onFolderCreate={handleCreateFolder}
      />

      <UploadDialog
        open={uploadDialogOpen}
        onClose={closeUploadDialog}
        onFileUpload={handleUploadFile}
      />
    </>
  );
};

export default CreateButton;
