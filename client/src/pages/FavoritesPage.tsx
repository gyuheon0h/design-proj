import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FolderProps } from '../components/Folder';
import axios from 'axios';
import Box from '@mui/material/Box';
import { useUser } from '../context/UserContext';
import CreateButton from '../components/CreateButton';
import { FileComponentProps } from '../components/File';
import { fetchFolderNames } from '../utils/helperRequests';
import Header from '../components/HeaderComponent';
import ContentComponent from '../components/Content';

const Favorites = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userContext = useUser();

  // Local state for search query to allow manual search as well
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleFetchData = () => fetchData(currentFolderId);

  const handleFolderClick = (folder: FolderProps) => {
    navigate(`/favorites/${[...folderPath, folder.id].join('/')}`);
  };

  const handleBreadcrumbClick = (index: number) => {
    navigate(`/favorites/${folderPath.slice(0, index + 1).join('/')}`);
  };

  // Handle local search input
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Header Section with Title, Breadcrumb, and Search Bar */}
      <Header
        title="Your Favorites:"
        location="Favorites"
        folderPath={folderPath}
        folderNames={folderNames}
        handleBreadcrumbClick={handleBreadcrumbClick}
        handleSearch={handleSearch}
        setFileTypeFilter={setFileTypeFilter}
        setCreatedAtFilter={setCreatedAtFilter}
        setModifiedAtFilter={setModifiedAtFilter}
      />

      {/* Scrollable Content */}
      <ContentComponent
        page="favorites"
        folders={folders}
        files={filteredFiles}
        onFolderClick={handleFolderClick}
        currentFolderId={currentFolderId}
        fetchData={handleFetchData}
        username={userContext?.username || ''}
        searchQuery={searchQuery}
      />

      {/* Create Button */}
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
