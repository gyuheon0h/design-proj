import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FolderProps } from '../components/Folder';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { FileComponentProps } from '../components/File';
import Box from '@mui/material/Box';
import {
  applyFilters,
  fetchFolderNames,
  useFilters,
  useFolderPath,
} from '../utils/helperRequests';
import { Permission } from '../interfaces/Permission';
import Header from '../components/HeaderComponent';
import ContentComponent from '../components/Content';

const Shared = () => {
  const navigate = useNavigate();
  const userContext = useUser();
  const { folderPath, currentFolderId } = useFolderPath('/shared');

  // Local state for search query
  const [searchQuery, setSearchQuery] = useState('');

  const [folders, setFolders] = useState<FolderProps[]>([]);
  const [files, setFiles] = useState<FileComponentProps[]>([]);
  const [folderNames, setFolderNames] = useState<{ [key: string]: string }>({});
  const [, setTopLevelPerms] = useState<Permission[]>([]); // Might need to have to display later

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

  // for filtering on frontend
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
  }, [folderPath]);

  //TODO: wat is this doing
  // useEffect(() => {
  //   fetchData(currentFolderId);
  //   fetchFolderNames(folderPath);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [currentFolderId]);

  const fetchData = async (folderId: string | null) => {
    try {
      let foldersRes, filesRes;

      if (!folderId) {
        const [sharedFolders, sharedFiles] = await Promise.all([
          axios.get('http://localhost:5001/api/folder/shared', {
            withCredentials: true,
          }),
          axios.get('http://localhost:5001/api/file/shared', {
            withCredentials: true,
          }),
        ]);
        foldersRes = sharedFolders.data.folders;
        filesRes = sharedFiles.data.files;
        setTopLevelPerms(sharedFiles.data.permissions);
      } else {
        const [sharedFolders, sharedFiles] = await Promise.all([
          axios.post(
            'http://localhost:5001/api/folder/parent/shared',
            { folderId },
            { withCredentials: true },
          ),
          axios.post(
            'http://localhost:5001/api/file/folder/shared',
            { folderId },
            { withCredentials: true },
          ),
        ]);
        foldersRes = sharedFolders.data;
        filesRes = sharedFiles.data;
      }

      setFolders(foldersRes);
      setFiles(filesRes);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleFolderClick = (folder: FolderProps) => {
    navigate(`/shared/${[...folderPath, folder.id].join('/')}`);
  };

  const handleBreadcrumbClick = (index: number) => {
    navigate(`/shared/${folderPath.slice(0, index + 1).join('/')}`);
  };

  // Handle search input
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFetchData = () => fetchData(currentFolderId);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Header Section with Title, Breadcrumb, and Search Bar */}
      <Header
        title="Shared With Me:"
        location="Shared"
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
        page="shared"
        folders={folders}
        files={filteredFiles}
        onFolderClick={handleFolderClick}
        currentFolderId={currentFolderId}
        fetchData={handleFetchData}
        username={userContext?.username || ''}
        searchQuery={searchQuery}
      />
    </Box>
  );
};

export default Shared;
