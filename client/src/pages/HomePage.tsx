import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FolderProps } from '../components/Folder';
import axios from 'axios';
import Box from '@mui/material/Box';
import CreateButton from '../components/CreateButton';
import { useUser } from '../context/UserContext';
import { FileComponentProps } from '../components/File';
import {
  applyFilters,
  fetchFolderNames,
  useFolderPath,
} from '../utils/helperRequests';
import Header from '../components/HeaderComponent';
import ContentComponent from '../components/Content';

const Home = () => {
  const navigate = useNavigate();
  const userContext = useUser();
  const { folderPath, currentFolderId } = useFolderPath('/home');

  // Local state for search query to allow manual search as well
  const [searchQuery, setSearchQuery] = useState('');

  const [folders, setFolders] = useState<FolderProps[]>([]);
  const [files, setFiles] = useState<FileComponentProps[]>([]);
  const [folderNames, setFolderNames] = useState<{ [key: string]: string }>({});

  // for filtering
  const [fileTypeFilter, setFileTypeFilter] = useState<string | null>(null);
  const [createdAtFilter, setCreatedAtFilter] = useState<string | null>(null);
  const [modifiedAtFilter, setModifiedAtFilter] = useState<string | null>(null);
  const [filteredFiles, setFilteredFiles] = useState<FileComponentProps[]>([]);

  // for filtering on frontend
  useEffect(() => {
    // Filter folders and files based on the selected filters
    const filteredFiles = applyFilters(
      files,
      fileTypeFilter,
      createdAtFilter,
      modifiedAtFilter,
    );

    setFilteredFiles(filteredFiles);
  }, [folders, files, fileTypeFilter, createdAtFilter, modifiedAtFilter]);

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
    fetchData(currentFolderId);
  }, [fileTypeFilter, createdAtFilter, modifiedAtFilter, currentFolderId]);

  const fetchData = async (folderId: string | null) => {
    const queryParams = new URLSearchParams();
    if (folderId) queryParams.append('folderId', folderId);
    if (fileTypeFilter) queryParams.append('fileType', fileTypeFilter);
    if (createdAtFilter) queryParams.append('createdAt', createdAtFilter);
    if (modifiedAtFilter)
      queryParams.append('lastModifiedAt', modifiedAtFilter);

    try {
      const [foldersRes, filesRes] = await Promise.all([
        axios.post(
          // 'http://localhost:5001/api/folder/parent',
          `http://localhost:5001/api/folder/parent?${queryParams.toString()}`,
          { folderId },
          { withCredentials: true },
        ),
        axios.post(
          // 'http://localhost:5001/api/file/folder',
          `http://localhost:5001/api/file/folder?${queryParams.toString()}`,
          { folderId },
          { withCredentials: true },
        ),
      ]);
      setFolders(foldersRes.data);
      setFiles(filesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleFolderClick = (folder: FolderProps) => {
    navigate(`/home/${[...folderPath, folder.id].join('/')}`);
  };

  const handleBreadcrumbClick = (index: number) => {
    navigate(`/home/${folderPath.slice(0, index + 1).join('/')}`);
  };

  // Handle local search input
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFetchData = () => fetchData(currentFolderId);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Header Section with Title, Breadcrumb, and Search Bar */}
      <Header
        title="Your File Storage:"
        location="Home"
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
        page="home"
        folders={folders}
        files={filteredFiles}
        onFolderClick={handleFolderClick}
        currentFolderId={currentFolderId}
        fetchData={handleFetchData}
        username={userContext?.username || ''}
        searchQuery={searchQuery}
      />

      <CreateButton currentFolderId={currentFolderId} refresh={fetchData} />
    </Box>
  );
};

export default Home;
