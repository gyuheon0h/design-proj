import React, { useState, useRef } from 'react';
import { Fab, Menu, MenuItem } from '@mui/material';
import axios from 'axios';
import UploadFileDialog from './UploadFileDialog';
import CreateFolderDialog from './CreateFolderDialog';
import AddIcon from '@mui/icons-material/Add';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import UploadFolderDialog from './UploadFolderDialog';

interface CreateButtonProps {
  currentFolderId: string | null;
  refreshFiles: (folderId: string | null) => void;
  refreshFolders: (folderId: string | null) => void;
}

const CreateButton: React.FC<CreateButtonProps> = ({
  currentFolderId,
  refreshFiles,
  refreshFolders,
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [uploadFileDialogOpen, setUploadFileDialogOpen] = useState(false);
  const [uploadFolderDialogOpen, setUploadFolderDialogOpen] = useState(false);

  // Drag detection
  const [didDrag, setDidDrag] = useState(false);

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const openFolderDialog = () => {
    setCreateFolderDialogOpen(true);
  };

  const closeFolderDialog = () => {
    setCreateFolderDialogOpen(false);
  };

  const openUploadFileDialog = () => {
    setUploadFileDialogOpen(true);
  };

  const closeUploadFileDialog = () => {
    setUploadFileDialogOpen(false);
  };

  const openUploadFolderDialog = () => {
    setUploadFolderDialogOpen(true);
  };

  const closeUploadFolderDialog = () => {
    setUploadFolderDialogOpen(false);
  };

  // Draggable handlers
  const handleDragStart = () => {
    // Reset drag state
    setDidDrag(false);
  };

  const handleDrag = (e: DraggableEvent, data: DraggableData) => {
    setDidDrag(true);
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
      refreshFiles(currentFolderId);
      return response.data;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  const handleUploadFolder = async (files: File[], folderName: string) => {
    const formData = new FormData();
    formData.append('folderName', folderName);

    files.forEach((file) => {
      formData.append('files', file, file.webkitRelativePath);
    });

    if (currentFolderId) {
      formData.append('parentFolder', currentFolderId);
    }

    try {
      const response = await axios.post(
        'http://localhost:5001/api/folder/upload',
        formData,
        { withCredentials: true },
      );
      refreshFolders(currentFolderId);
      return response.data;
    } catch (error) {
      console.error('Folder upload failed:', error);
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
      refreshFolders(currentFolderId);
      return response.data;
    } catch (error) {
      console.error('Folder creation failed:', error);
      throw error;
    }
  };

  return (
    <>
      <Draggable
        nodeRef={nodeRef as React.RefObject<HTMLElement>}
        onStart={handleDragStart}
        onDrag={handleDrag}
      >
        <div ref={nodeRef}>
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
        </div>
      </Draggable>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen && !didDrag}
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
            openUploadFileDialog();
          }}
        >
          Upload a File
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            openUploadFolderDialog();
          }}
        >
          Upload a Folder
        </MenuItem>
      </Menu>

      <CreateFolderDialog
        open={createFolderDialogOpen}
        onClose={closeFolderDialog}
        currentFolderId={currentFolderId}
        onFolderCreate={handleCreateFolder}
      />

      <UploadFileDialog
        open={uploadFileDialogOpen}
        onClose={closeUploadFileDialog}
        onFileUpload={handleUploadFile}
      />

      <UploadFolderDialog
        open={uploadFolderDialogOpen}
        onClose={closeUploadFolderDialog}
        onFolderUpload={handleUploadFolder}
      />
    </>
  );
};

export default CreateButton;
