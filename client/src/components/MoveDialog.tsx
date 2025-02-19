import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Typography,
} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIos';
import axios from 'axios';

export interface FolderProps {
  id: string;
  name: string;
  parentFolder: string | null;
}

interface MoveDialogProps {
  open: boolean;
  fileName: string;
  fileId: string;
  resourceType: 'folder' | 'file';
  parentFolderId: string | null;
  onClose: () => void;
}

const MoveDialog: React.FC<MoveDialogProps> = ({
  open,
  fileName,
  fileId,
  resourceType,
  parentFolderId,
  onClose,
}) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(
    parentFolderId,
  );
  const [folders, setFolders] = useState<FolderProps[]>([]);
  const [folderHistory, setFolderHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchSubFolders(currentFolderId);
      setFolderHistory([]);
      setSelectedFolderId(null);
    }
  }, [open]);

  useEffect(() => {
    fetchSubFolders(currentFolderId);
  }, [currentFolderId]);

  const fetchSubFolders = async (folderId: string | null) => {
    setLoading(true);
    try {
      const res = await axios.post(
        'http://localhost:5001/api/folder/parent',
        { folderId: folderId },
        { withCredentials: true },
      );
      setFolders(res.data);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
    setLoading(false);
  };

  const handleFolderClick = (folderId: string) => {
    console.log('navigating into ', folderId);
    setFolderHistory((prev) => [...prev, currentFolderId ?? 'root']);
    setCurrentFolderId(folderId);
    setSelectedFolderId(null);
  };

  const handleGoBack = () => {
    if (folderHistory.length > 0) {
      const lastFolder = folderHistory.pop();
      setFolderHistory([...folderHistory]);
      setCurrentFolderId(lastFolder ?? null);
      setSelectedFolderId(null);
    }
  };

  const handleSelectFolder = (folderId: string) => {
    setSelectedFolderId(folderId);
  };

  const handleMove = async () => {
    if (!selectedFolderId) return;
    try {
      await axios.patch(
        `http://localhost:5001/api/${resourceType}/move/${fileId}`,
        { parentFolderId: selectedFolderId },
        { withCredentials: true },
      );
    } catch (error) {
      console.error('Error moving file:', error);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Move "{fileName}"</DialogTitle>
      <DialogContent>
        <Typography>Current Folder: {selectedFolderId}</Typography>
        {/* Back Button */}
        {folderHistory.length > 0 && (
          <IconButton onClick={handleGoBack}>
            <ArrowBackIosNewIcon />
          </IconButton>
        )}

        {/* Loading Indicator */}
        {loading ? (
          <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />
        ) : (
          <List>
            {folders.map((folder) => (
              <ListItem
                key={folder.id}
                component="div"
                onClick={() => handleFolderClick(folder.id)}
                sx={{
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor:
                    selectedFolderId === folder.id
                      ? 'rgba(0, 0, 255, 0.1)'
                      : 'transparent',
                }}
              >
                <ListItemText
                  primary={folder.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectFolder(folder.id);
                  }}
                />
                <ArrowForwardIosIcon />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={handleMove}
          color="primary"
          variant="contained"
          disabled={!selectedFolderId || selectedFolderId === parentFolderId}
        >
          Move
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MoveDialog;
