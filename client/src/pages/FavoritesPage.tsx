import Divider from '@mui/material/Divider';
import SearchBar from '../components/SearchBar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { typography } from '../Styles';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FolderProps } from '../components/Folder';
import axios from 'axios';
import FileContainer from '../components/FileContainer';
import FolderContainer from '../components/FolderContainer';
import { useUser } from '../context/UserContext';

const Favorites = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userContext = useUser();

  const folderPath = location.pathname
    .replace('/favorites', '')
    .split('/')
    .filter(Boolean);
  const currentFolderId = folderPath.length
    ? folderPath[folderPath.length - 1]
    : null;

  const [folders, setFolders] = useState<FolderProps[]>([]);
  const [files, setFiles] = useState([]);
  const [folderNames, setFolderNames] = useState<{ [key: string]: string }>({});
  const itemsPerPage = 5;

  useEffect(() => {
    fetchData(currentFolderId);
    fetchFolderNames(folderPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId]);

  const fetchData = async (folderId: string | null) => {
    try {
      let foldersRes, filesRes;

      if (!folderId) {
        console.log('in favorites page');
        [foldersRes, filesRes] = await Promise.all([
          axios.get('http://localhost:5001/api/folder/favorites', {
            withCredentials: true,
          }),
          axios.get('http://localhost:5001/api/file/favorites', {
            withCredentials: true,
          }),
        ]);
      } else {
        console.log('in nested favorites page');
        [foldersRes, filesRes] = await Promise.all([
          axios.post(
            'http://localhost:5001/api/folder/parent',
            { folderId },
            { withCredentials: true },
          ),
          axios.post(
            'http://localhost:5001/api/file/folder',
            { folderId },
            { withCredentials: true },
          ),
        ]);
      }

      setFolders(foldersRes.data);
      setFiles(filesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchFolderNames = async (folderIds: string[]) => {
    try {
      const nameRequests = folderIds.map((id) =>
        axios.get(`http://localhost:5001/api/folder/foldername/${id}`),
      );
      const nameResponses = await Promise.all(nameRequests);
      const newFolderNames: { [key: string]: string } = {};
      folderIds.forEach((id, index) => {
        newFolderNames[id] = nameResponses[index].data;
      });
      setFolderNames((prevNames) => ({ ...prevNames, ...newFolderNames }));
    } catch (error) {
      console.error('Error fetching folder names:', error);
    }
  };

  const handleFolderClick = (folder: FolderProps) => {
    navigate(`/favorites/${[...folderPath, folder.id].join('/')}`);
  };

  const handleBreadcrumbClick = (index: number) => {
    navigate(`/favorites/${folderPath.slice(0, index + 1).join('/')}`);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Header Section with Title, Breadcrumb, and Search Bar */}
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
          Your Favorites:
        </Typography>

        {/* Search Bar */}
        <SearchBar location="Favorites" />

        {/* Breadcrumb Navigation */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
          }}
        >
          {['Favorites', ...folderPath].map((crumb, index) => (
            <span
              key={index}
              onClick={() => handleBreadcrumbClick(index - 1)}
              style={{
                cursor: 'pointer',
                color: '#161C94',
                fontWeight: 'bold',
                marginLeft: '10px',
              }}
            >
              {index === 0 ? 'Favorites' : folderNames[crumb] || ''}
              {index < folderPath.length ? ' / ' : ''}
            </span>
          ))}
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', padding: '20px' }}>
        <div style={{ marginLeft: '10px' }}>
          <FolderContainer
            folders={folders}
            onFolderClick={handleFolderClick}
            currentFolderId={currentFolderId}
            refreshFolders={fetchData}
            itemsPerPage={itemsPerPage}
            username={userContext?.username || ''}
          />
        </div>

        <Divider style={{ margin: '20px 0' }} />

        {/* Files Section */}
        <div style={{ marginLeft: '10px' }}>
          <FileContainer
            files={files}
            currentFolderId={currentFolderId}
            refreshFiles={fetchData}
            username={userContext?.username || ''}
          />
        </div>
      </Box>
    </Box>
  );
};

export default Favorites;
