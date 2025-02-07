import Divider from '@mui/material/Divider';
import SearchBar from '../components/SearchBar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { typography } from '../Styles';
import { useEffect, useState } from 'react';
import { FolderProps } from '../components/Folder';
import axios from 'axios';
import FolderContainer from '../components/FolderContainer';
import FileContainer from '../components/FileContainer';
import { useUser } from '../context/UserContext';

const Trash = () => {
  const userContext = useUser();

  const [folders, setFolders] = useState<FolderProps[]>([]);
  const [files, setFiles] = useState([]);
  const fetchData = async () => {
    try {
      const [foldersRes, filesRes] = await Promise.all([
        axios.get('http://localhost:5001/api/folder/trash', {
          withCredentials: true,
        }),
        axios.get('http://localhost:5001/api/file/trash', {
          withCredentials: true,
        }),
      ]);
      setFolders(foldersRes.data);
      setFiles(filesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  console.log(folders, files);
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Header Section with Title and Search Bar */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          left: 0,
          backgroundColor: 'white',
          zIndex: 1000,
          padding: '15px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Title */}
        <Typography
          variant="h1"
          sx={{
            fontWeight: 'bold',
            fontFamily: typography.fontFamily,
            fontSize: typography.fontSize.extraLarge,
            color: '#161C94',
            marginLeft: '10px',
            paddingTop: '25px',
            paddingBottom: '30px',
          }}
        >
          Trash Bin:
        </Typography>

        {/* Search Bar */}
        <SearchBar location="Trash" />
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', padding: '20px' }}>
        {/* Folders Section */}
        <Box sx={{ marginLeft: '10px' }}>
          <div style={{ marginLeft: '10px' }}>
            <FolderContainer
              page={'trash'}
              folders={folders}
              onFolderClick={() => {
                alert('You cannot view folders in the trash bin.');
              }}
              currentFolderId={null}
              refreshFolders={fetchData}
              itemsPerPage={5}
              username={userContext?.username || ''}
            />
          </div>

          <Divider style={{ margin: '20px 0' }} />

          {/* Files Section */}
          <div style={{ marginLeft: '10px' }}>
            <FileContainer
              page={'trash'}
              files={files}
              currentFolderId={null}
              refreshFiles={fetchData}
              username={userContext?.username || ''}
            />
          </div>
        </Box>

        <Divider sx={{ margin: '20px 0' }} />
      </Box>
    </Box>
  );
};

export default Trash;
