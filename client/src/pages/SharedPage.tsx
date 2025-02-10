import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import FileContainer from '../components/FileContainer';
import FolderContainer from '../components/FolderContainer';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import axios from 'axios';
import { typography } from '../Styles';
import { useUser } from '../context/UserContext';

interface SharedProps {
  searchQuery: string;
}

const Shared: React.FC<SharedProps> = ({ searchQuery: externalSearchQuery }) => {
  const navigate = useNavigate();
  const userContext = useUser();

  // Local state for search query
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  // Use external search query if provided, otherwise use local search query
  const searchQuery = externalSearchQuery || localSearchQuery;

  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchSharedData();
  }, []);

  const fetchSharedData = async () => {
    try {
      const [foldersRes, filesRes] = await Promise.all([
        axios.get('http://localhost:5001/api/folder/shared', {
          withCredentials: true,
        }),
        axios.get('http://localhost:5001/api/file/shared', {
          withCredentials: true,
        }),
      ]);

      setFolders(foldersRes.data);
      setFiles(filesRes.data);
    } catch (error) {
      console.error('Error fetching shared data:', error);
    }
  };

  // Handle search input
  const handleSearch = (query: string) => {
    setLocalSearchQuery(query);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Header Section with Title, Search Bar */}
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
            paddingBottom: '15px',
          }}
        >
          Shared With Me:
        </Typography>

        {/* SearchBar added here */}
        <Box sx={{ marginLeft: '10px' }}>
          <SearchBar 
            location="Shared With Me" 
            onSearch={handleSearch} 
          />
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', padding: '20px' }}>
        {/* Folders Section */}
        <div style={{ marginLeft: '10px' }}>
          <FolderContainer
            page="shared"
            folders={folders} // No filtering here, same as Home/Favorites
            onFolderClick={() => {}}
            currentFolderId={null}
            refreshFolders={fetchSharedData}
            itemsPerPage={5}
            username={userContext?.username || ''}
            searchQuery={searchQuery}
          />
        </div>

        <Divider style={{ margin: '20px 0' }} />

        {/* Files Section */}
        <div style={{ marginLeft: '10px' }}>
          <FileContainer
            page="shared"
            files={files} // No filtering here, same as Home/Favorites
            currentFolderId={null}
            refreshFiles={fetchSharedData}
            username={userContext?.username || ''}
            searchQuery={searchQuery}
          />
        </div>
      </Box>
    </Box>
  );
};

export default Shared;
