import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { FolderProps } from '../components/Folder';
import FileContainer from '../components/FileContainer';
import Divider from '@mui/material/Divider';
import axios from 'axios';
import FolderContainer from '../components/FolderContainer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { typography } from '../Styles';
import { useUser } from '../context/UserContext';
import CreateButton from '../components/CreateButton';
import { FileComponentProps } from '../components/File';
import { fetchFolderNames } from '../utils/helperRequests';

interface FavoritesProps {
  searchQuery: string;
}

const Favorites: React.FC<FavoritesProps> = ({
  searchQuery: externalSearchQuery,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const userContext = useUser();

  // Local state for search query to allow manual search as well
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  // Use external search query if provided, otherwise use local search query
  const searchQuery = externalSearchQuery || localSearchQuery;

  const folderPath = location.pathname
    .replace('/favorites', '')
    .split('/')
    .filter(Boolean);
  const currentFolderId = folderPath.length
    ? folderPath[folderPath.length - 1]
    : null;

  const [folders, setFolders] = useState<FolderProps[]>([]);
  const [files, setFiles] = useState<FileComponentProps[]>([]);
  const [folderNames, setFolderNames] = useState<{ [key: string]: string }>({});

  // for filtering
  const [fileTypeFilter, setFileTypeFilter] = useState<string | null>(null);
  const [createdAtFilter, setCreatedAtFilter] = useState<string | null>(null);
  const [modifiedAtFilter, setModifiedAtFilter] = useState<string | null>(null);
  const [filteredFolders, setFilteredFolders] = useState<FolderProps[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileComponentProps[]>([]);

  const itemsPerPage = 5;

  useEffect(() => {
    fetchData(currentFolderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId]);

  useEffect(() => {
    const fetchNames = async () => {
      const names = await fetchFolderNames(folderPath);

      setFolderNames((prevNames) => {
        const isDifferent = folderPath.some(
          (id) => prevNames[id] !== names[id],
        );
        return isDifferent ? { ...prevNames, ...names } : prevNames;
      });
    };

    fetchNames();
  }, [folderPath]); // Separate effect for folder names

  // for filtering
  useEffect(() => {
    // Filter folders and files based on the selected filters

    const filteredFiles = files.filter((file) => {
      /* FILE TYPE */
      const fileType =
        '.' + file.fileType.substring(file.fileType.indexOf('/') + 1);

      const matchesFileType = fileTypeFilter
        ? fileType === fileTypeFilter
        : true;

      /* CREATED AT */
      const now = new Date();
      let createdStartDate: Date | null = null;
      if (createdAtFilter === 'Today') {
        createdStartDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
      } else if (createdAtFilter === 'Last Week') {
        createdStartDate = new Date();
        createdStartDate.setDate(now.getDate() - 7);
      } else if (createdAtFilter === 'Last Month') {
        createdStartDate = new Date();
        createdStartDate.setMonth(now.getMonth() - 1);
      }
      const fileCreatedAt = new Date(file.createdAt);
      const matchesCreatedAt = createdStartDate
        ? fileCreatedAt >= createdStartDate
        : true;

      /* MODIFIED AT */
      let startDate: Date | null = null;

      if (modifiedAtFilter === 'Today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Midnight today
      } else if (modifiedAtFilter === 'Last Week') {
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
      } else if (modifiedAtFilter === 'Last Month') {
        startDate = new Date();
        startDate.setMonth(now.getMonth() - 1);
      }

      // Convert lastModifiedAt to Date and check if it falls in the range
      const fileModifiedAt = new Date(file.lastModifiedAt);
      const matchesModifiedAt = startDate ? fileModifiedAt >= startDate : true;

      return matchesFileType && matchesCreatedAt && matchesModifiedAt;
    });

    setFilteredFolders(filteredFolders);
    setFilteredFiles(filteredFiles);
  }, [folders, files, fileTypeFilter, createdAtFilter, modifiedAtFilter]);

  // for filtering
  useEffect(() => {
    fetchData(currentFolderId);
  }, [fileTypeFilter, createdAtFilter, modifiedAtFilter, currentFolderId]);

  const fetchData = async (folderId: string | null) => {
    try {
      let foldersRes, filesRes;

      if (!folderId) {
        [foldersRes, filesRes] = await Promise.all([
          axios.get('http://localhost:5001/api/folder/favorites', {
            withCredentials: true,
          }),
          axios.get('http://localhost:5001/api/file/favorites', {
            withCredentials: true,
          }),
        ]);
      } else {
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

  const handleFolderClick = (folder: FolderProps) => {
    navigate(`/favorites/${[...folderPath, folder.id].join('/')}`);
  };

  const handleBreadcrumbClick = (index: number) => {
    navigate(`/favorites/${folderPath.slice(0, index + 1).join('/')}`);
  };

  // Handle local search input
  const handleSearch = (query: string) => {
    setLocalSearchQuery(query);
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
            paddingBottom: '15px',
          }}
        >
          Your Favorites:
        </Typography>

        {/* SearchBar added here */}
        <Box sx={{ marginLeft: '10px' }}>
          <SearchBar
            location="Favorites"
            onSearch={handleSearch}
            setFileTypeFilter={setFileTypeFilter}
            setCreatedAtFilter={setCreatedAtFilter}
            setModifiedAtFilter={setModifiedAtFilter}
          />
        </Box>

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
                paddingTop: '10px',
              }}
            >
              {index === 0 ? 'Favorites' : folderNames[crumb] || ''}
              {index < folderPath.length ? ' / ' : ''}
            </span>
          ))}
        </Box>
      </Box>

      {/* Scrollable Content */}
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
            page="favorites"
            folders={folders}
            onFolderClick={handleFolderClick}
            currentFolderId={currentFolderId}
            refreshFolders={fetchData}
            itemsPerPage={itemsPerPage}
            username={userContext?.username || ''}
            searchQuery={searchQuery}
          />
        </div>

        <Divider style={{ margin: '20px 0' }} />

        {/* Files Section */}
        <div style={{ marginLeft: '10px' }}>
          <FileContainer
            files={filteredFiles}
            currentFolderId={currentFolderId}
            refreshFiles={fetchData}
            username={userContext?.username || ''}
            searchQuery={searchQuery}
            page={'favorites'}
          />
        </div>
      </Box>
      {currentFolderId && (
        <CreateButton
          currentFolderId={currentFolderId}
          refresh={fetchData}
        ></CreateButton>
      )}
    </Box>
  );
};

export default Favorites;
