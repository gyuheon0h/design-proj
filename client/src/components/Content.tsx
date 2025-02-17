import React from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import FolderContainer from '../components/FolderContainer';
import FileContainer from '../components/FileContainer';

interface ContentComponentProps {
  page: 'home' | 'shared' | 'favorites' | 'trash';
  folders: any[]; //TODO: avoid using any when possible...
  files: any[];
  onFolderClick: (folder: any) => void;
  currentFolderId: string | null;
  fetchData: () => void;
  username: string;
  searchQuery: string;
}

const ContentComponent: React.FC<ContentComponentProps> = ({
  page,
  folders,
  files,
  onFolderClick,
  currentFolderId,
  fetchData,
  username,
  searchQuery,
}) => {
  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: 'auto',
        padding: '20px',
        paddingTop: '0px',
      }}
    >
      <div style={{ marginLeft: '10px' }}>
        <FolderContainer
          page={page}
          folders={folders}
          onFolderClick={onFolderClick}
          currentFolderId={currentFolderId}
          refreshFolders={fetchData}
          username={username}
          searchQuery={searchQuery}
        />
      </div>

      <Divider style={{ margin: '20px 0' }} />

      <div style={{ marginLeft: '10px' }}>
        <FileContainer
          page={page}
          files={files}
          currentFolderId={currentFolderId}
          refreshFiles={fetchData}
          username={username}
          searchQuery={searchQuery}
        />
      </div>
    </Box>
  );
};

export default ContentComponent;
