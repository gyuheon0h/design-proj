import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderProps } from '../components/Folder';
import axios from 'axios';
import Box from '@mui/material/Box';
import { useUser } from '../context/UserContext';
import CreateButton from '../components/CreateButton';
import { FileComponentProps } from '../components/File';
import {
  applyFilters,
  fetchFolderNames,
  useFilters,
  useFolderPath,
} from '../utils/helperRequests';
import Header from '../components/HeaderComponent';
import ContentComponent from '../components/Content';

const Favorites = () => {
  const navigate = useNavigate();
  const userContext = useUser();
  const { folderPath, currentFolderId } = useFolderPath('/favorites');

  // Local state for search query to allow manual search as well
  const [searchQuery, setSearchQuery] = useState('');

  const [folders, setFolders] = useState<FolderProps[]>([]);
  const [files, setFiles] = useState<FileComponentProps[]>([]);
  const [folderNames, setFolderNames] = useState<{ [key: string]: string }>({});

  // for filtering
  const {
    filters,
    setFileTypeFilter,
    setCreatedAtFilter,
    setModifiedAtFilter,
    filteredFiles,
    setFilteredFiles,
  } = useFilters();

  useEffect(() => {
    fetchData(currentFolderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId, filters]);

  // for filtering
  useEffect(() => {
    // Filter folders and files based on the selected filters
    setFilteredFiles(
      applyFilters(
        files,
        filters.fileType,
        filters.createdAt,
        filters.modifiedAt,
      ),
    );
  }, [files, filters, setFilteredFiles]);

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

  const fetchData = async (folderId: string | null) => {
    //TODO: missing query params...
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
