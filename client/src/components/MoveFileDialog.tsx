import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';
import axios from 'axios';

export interface FolderProps {
  page: 'home' | 'shared' | 'favorites' | 'trash';
  id: string;
  name: string;
  owner: string;
  createdAt: Date;
  parentFolder: string | null;
  isFavorited: boolean;
  onClick: (folder: FolderProps) => void;
  handleDeleteFolder: (folderId: string) => Promise<void>;
  handleFavoriteFolder: (folderId: string) => void;
  handleRestoreFolder: (folderId: string) => void;
  handleRenameFolder: (folderId: string, newFolderName: string) => void;
}

interface MoveDialogProps {
  open: boolean;
  fileName: string;
  fileId: string;
  parentFolderId: string;
  onClose: () => void;
  onMove: (fileId: string, parentFolderId: string) => void;
}

const MoveDialog: React.FC<MoveDialogProps> = ({
  open,
  fileName,
  fileId,
  parentFolderId,
  onClose,
  onMove,
}) => {
  const [newParentFolderId, setNewParentFolderId] = useState(parentFolderId);
  const [folders, setFolders] = useState<FolderProps[]>([]);

  useEffect(() => {
    fetchFolders(newParentFolderId);
  }, [newParentFolderId]);

  const handleMove = () => {
    onMove(fileId, newParentFolderId);
    onClose();
  };

  const fetchFolders = async (newParentFolderId: string | null) => {
    try {
      const foldersRes = await axios.post(
        'http://localhost:5001/api/folder/parent',
        { newParentFolderId },
        { withCredentials: true },
      );
      setFolders(foldersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Move {fileName}</DialogTitle>
      <DialogContent></DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={handleMove}
          color="primary"
          variant="contained"
          disabled={newParentFolderId === parentFolderId}
        >
          Rename
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MoveDialog;
