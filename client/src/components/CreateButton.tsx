import React, { useState, useRef } from 'react';
import { Fab, Menu, MenuItem } from '@mui/material';
import axios from 'axios';
import UploadFileDialog from './UploadFileDialog';
import FolderDialog from './CreateFolderDialog';
import AddIcon from '@mui/icons-material/Add';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import UploadProgressToast from './UploadProgress';
import { useUser } from '../context/UserContext';
import OwlNoteEditorDialog from './OwlNoteEditorDialog';
import { v4 as uuidv4 } from 'uuid';
import { UploadFolderDialog } from './UploadFolderDialog';

interface CreateButtonProps {
  currentFolderId: string | null;
  refreshFiles: (folderId: string | null) => void;
  refreshFolders: (folderId: string | null) => void;
  refreshStorage: () => Promise<void>;
}

interface UploadInProgress {
  file: File;
  id: string;
  parentFolder: string | null;
}

const CreateButton: React.FC<CreateButtonProps> = ({
  currentFolderId,
  refreshFiles,
  refreshFolders,
  refreshStorage,
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const userContext = useUser();
  const userId = userContext.userId;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [uploadFileDialogOpen, setUploadFileDialogOpen] = useState(false);
  const [uploadFolderDialogOpen, setUploadFolderDialogOpen] = useState(false);
  const [owlNoteEditorDialogOpen, setOwlNoteEditorDialogOpen] = useState(false);
  // Drag detection
  const [didDrag, setDidDrag] = useState(false);

  const menuOpen = Boolean(anchorEl);

  const handleMenuClose = () => setAnchorEl(null);
  const openCreateFolderDialog = () => setFolderDialogOpen(true);
  const closeFolderDialog = () => setFolderDialogOpen(false);
  const openUploadFileDialog = () => setUploadFileDialogOpen(true);
  const openUploadFolderDialog = () => setUploadFolderDialogOpen(true);
  const closeUploadFileDialog = () => setUploadFileDialogOpen(false);
  const closeUploadFolderDialog = () => setUploadFolderDialogOpen(false);

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

  const [uploadsInProgress, setUploadsInProgress] = useState<
    UploadInProgress[]
  >([]);

  const handleBatchFileUpload = async (
    uploads: { file: File; relativePath: string }[],
    folderPathToFolderId?: Map<string, string>,
  ) => {
    const newUploads: UploadInProgress[] = uploads.map(
      ({ file, relativePath }) => {
        const id = uuidv4();

        let parentFolder: string | null = currentFolderId;
        if (folderPathToFolderId) {
          const parts = relativePath.split('/');
          const subPath = parts.slice(1, -1).join('/');
          parentFolder = folderPathToFolderId.get(subPath) || currentFolderId;
        }
        const wrapped = new File([file], file.name, { type: file.type });
        return { file: wrapped, id, parentFolder };
      },
    );

    setUploadsInProgress((prev) => [...prev, ...newUploads]);
    setUploadFileDialogOpen(false);
    setUploadFolderDialogOpen(false);
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
            openCreateFolderDialog();
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
          Upload File(s)
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            openUploadFolderDialog();
          }}
        >
          Upload a Folder
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            setOwlNoteEditorDialogOpen(true);
          }}
        >
          Create OwlNote File
        </MenuItem>
      </Menu>
      {folderDialogOpen && (
        <FolderDialog
          open={folderDialogOpen}
          onClose={closeFolderDialog}
          currentFolderId={currentFolderId}
          onFolderCreate={handleCreateFolder}
        />
      )}
      {uploadFileDialogOpen && (
        <UploadFileDialog
          open={uploadFileDialogOpen}
          onClose={closeUploadFileDialog}
          onBatchUpload={handleBatchFileUpload}
          currentFolderId={currentFolderId}
        />
      )}
      {/* //TODO: good dialog design practice */}
      {uploadFolderDialogOpen && (
        <UploadFolderDialog
          open={uploadFolderDialogOpen}
          onClose={closeUploadFolderDialog}
          onBatchUpload={handleBatchFileUpload}
          currentFolderId={currentFolderId}
        />
      )}
      {uploadsInProgress.map(({ file, id, parentFolder }, index) => (
        <UploadProgressToast
          key={id}
          file={file}
          fileId={id}
          parentFolder={parentFolder}
          userId={userId}
          onClose={() =>
            setUploadsInProgress((prev) => prev.filter((u) => u.id !== id))
          }
          refreshFiles={refreshFiles}
          refreshStorage={refreshStorage}
          offset={index}
        />
      ))}
      {owlNoteEditorDialogOpen && (
        <OwlNoteEditorDialog
          // fileName="file1" //TODO: hardcode filename for now, fix later
          parentFolder={currentFolderId}
          open={owlNoteEditorDialogOpen}
          onClose={() => setOwlNoteEditorDialogOpen(false)}
          onOwlNoteCreate={handleCreateOwlNote}
          fileName={null}
        />
      )}
    </>
  );
};

export default CreateButton;
