import React, { useState, useRef } from 'react';
import { Fab, Menu, MenuItem } from '@mui/material';
import axios from 'axios';
import UploadDialog from './CreateFileDialog';
import FolderDialog from './CreateFolderDialog';
import AddIcon from '@mui/icons-material/Add';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { useUser } from '../context/UserContext';
import OwlNoteEditorDialog from './OwlNoteEditorDialog';
import { UploadSharp } from '@mui/icons-material';

interface CreateButtonProps {
  currentFolderId: string | null;
  refreshFiles: (folderId: string | null) => void;
  refreshFolders: (folderId: string | null) => void;
  refreshStorage: () => Promise<void>;
  onBatchUpload: (uploads: {
    file: File;
    relativePath: string;
  }[],
    parentFolder: string | null, 
  ) => Promise<void>;
}

const CreateButton: React.FC<CreateButtonProps> = ({
  currentFolderId,
  refreshFiles,
  refreshFolders,
  refreshStorage,
  onBatchUpload,
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const userContext = useUser();
  const userId = userContext.userId;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [blockNoteOpen, setBlockNoteOpen] = useState(false);
  // Drag detection
  const [didDrag, setDidDrag] = useState(false);

  const menuOpen = Boolean(anchorEl);

  const handleMenuClose = () => setAnchorEl(null);
  const openFolderDialog = () => setFolderDialogOpen(true);
  const closeFolderDialog = () => setFolderDialogOpen(false);
  const openUploadDialog = () => setUploadDialogOpen(true);
  const closeUploadDialog = () => setUploadDialogOpen(false);

  const handleDragStart = () => setDidDrag(false);
  const handleDrag = (e: DraggableEvent, data: DraggableData) =>
    setDidDrag(true);

  const handleCreateFolder = async (
    folderName: string,
    parentFolder: string | null,
  ) => {
    const requestBody = { name: folderName, parentFolder };
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/folder/create`,
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



  const handleCreateOwlNote = async (
    fileName: string,
    content: string,
    parentFolder: string | null,
  ) => {
    const requestBody = { fileName, content, parentFolder };
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/file/create/owlnote`,
        requestBody,
        { withCredentials: true },
      );
      refreshFiles(currentFolderId);
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
        onClose={handleMenuClose}
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
        <MenuItem
          onClick={() => {
            handleMenuClose();
            setBlockNoteOpen(true);
          }}
        >
          Create OwlNote File
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
        onBatchUpload={(uploads) => onBatchUpload(uploads, currentFolderId)}
        currentFolderId={currentFolderId}
      />

      <OwlNoteEditorDialog
        // fileName="file1" //TODO: hardcode filename for now, fix later
        parentFolder={currentFolderId}
        open={blockNoteOpen}
        onClose={() => setBlockNoteOpen(false)}
        onOwlNoteCreate={handleCreateOwlNote}
        fileName={null}
      />
    </>
  );
};

export default CreateButton;
