import React, { useState } from 'react';
import { Button } from '@mui/material';
import Folder, { FolderProp } from './Folder';
import FolderDialog from '../pages/FolderDialog';
import { colors, typography } from '../Styles';
import axios from 'axios';

interface FolderContainerProps {
  folders: FolderProp[];
  onFolderClick: (folder: FolderProp) => void;
}

const FolderContainer: React.FC<FolderContainerProps> = ({
  folders,
  onFolderClick,
}) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleCreateFolder = async (
    folderName: string,
    parentFolder: string | null,
  ) => {
    const requestBody = { name: folderName, parentFolder };
    try {
      const response = await axios.post(
        'http://localhost:5001/api/folder/create',
        requestBody,
        {
          withCredentials: true,
        },
      );

      console.log('Folder creation successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Folder creation failed:', error);
      throw error;
    }
  };

  return (
    <div>
      {/* Header section with title and create button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '15px',
        }}
      >
        <h2>Folders</h2>

        <Button
          variant="contained"
          onClick={handleOpen}
          sx={{
            backgroundColor: colors.lightBlue,
            color: colors.darkBlue,
            fontFamily: typography.fontFamily,
            fontSize: typography.fontSize.medium,
            fontWeight: 'bold',
            marginLeft: '15px',
            '&:hover': {
              backgroundColor: colors.darkBlue,
              color: colors.white,
            },
          }}
        >
          + Create Folder
        </Button>
      </div>

      {/* Folder List */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
        {folders.map((folder) => (
          <Folder
            key={folder.id}
            id={folder.id}
            name={folder.name}
            owner={folder.owner}
            createdAt={folder.createdAt}
            parentFolder={folder.parentFolder}
            folderChildren={folder.folderChildren}
            fileChildren={folder.fileChildren}
            onClick={() => onFolderClick(folder)}
          />
        ))}
      </div>

      {/* Dialog */}
      <FolderDialog
        open={open}
        onClose={handleClose}
        onFolderCreate={handleCreateFolder}
      />
    </div>
  );
};

export default FolderContainer;
