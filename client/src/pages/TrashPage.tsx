import { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import FileContainer from '../components/FileContainer';
import FolderContainer from '../components/FolderContainer';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import axios from 'axios';
import { typography } from '../Styles';
import { useUser } from '../context/UserContext';
import { FolderProps } from '../components/Folder';

interface TrashProps {
  searchQuery: string;
}

const Trash: React.FC<TrashProps> = ({ searchQuery: externalSearchQuery }) => {
  const userContext = useUser();

  // Local state for search query
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  // Use external search query if provided, otherwise use local search query
  const searchQuery = externalSearchQuery || localSearchQuery;

  const [folders, setFolders] = useState<FolderProps[]>([]);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

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
          Trash Bin:
        </Typography>

        {/* SearchBar added here */}
        <Box sx={{ marginLeft: '10px' }}>
          <SearchBar 
            location="Trash Bin" 
            onSearch={handleSearch} 
          />
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', padding: '20px' }}>
        {/* Folders Section */}
        <div style={{ marginLeft: '10px' }}>
          <FolderContainer
            page="trash"
            folders={folders}
            onFolderClick={() => {
              alert('You cannot view folders in the trash bin.');
            }}
            currentFolderId={null}
            refreshFolders={fetchData}
            itemsPerPage={5}
            username={userContext?.username || ''}
            searchQuery={searchQuery}
          />
        </div>

        <Divider style={{ margin: '20px 0' }} />

        {/* Files Section */}
        <div style={{ marginLeft: '10px' }}>
          <FileContainer
            page="trash"
            files={files}
            currentFolderId={null}
            refreshFiles={fetchData}
            username={userContext?.username || ''}
            searchQuery={searchQuery}
          />
        </div>
      </Box>

      <Divider sx={{ margin: '20px 0' }} />
    </Box>
  );
};

export default Trash;
