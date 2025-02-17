import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FolderProps } from '../components/Folder';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { FileComponentProps } from '../components/File';
import Box from '@mui/material/Box';
import { fetchFolderNames } from '../utils/helperRequests';
import { Permission } from '../interfaces/Permission';
import Header from '../components/HeaderComponent';
import ContentComponent from '../components/Content';

const Shared = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userContext = useUser();

  // Local state for search query
  const [searchQuery, setSearchQuery] = useState('');

  const folderPath = location.pathname
    .replace('/shared', '')
    .split('/')
    .filter(Boolean);
  const currentFolderId = folderPath.length
    ? folderPath[folderPath.length - 1]
    : null;

  const [folders, setFolders] = useState<FolderProps[]>([]);
  const [files, setFiles] = useState<FileComponentProps[]>([]);
  const [folderNames, setFolderNames] = useState<{ [key: string]: string }>({});
  const [, setTopLevelPerms] = useState<Permission[]>([]); // Might need to have to display later

  // for filtering
  const [fileTypeFilter, setFileTypeFilter] = useState<string | null>(null);
  const [createdAtFilter, setCreatedAtFilter] = useState<string | null>(null);
  const [modifiedAtFilter, setModifiedAtFilter] = useState<string | null>(null);
  const [filteredFolders, setFilteredFolders] = useState<FolderProps[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileComponentProps[]>([]);

  // for filtering on frontend
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
  }, [folderPath]);

  // for filtering
  useEffect(() => {
    console.log('Current Filters:', {
      fileTypeFilter,
      createdAtFilter,
      modifiedAtFilter,
    });

    fetchData(currentFolderId);
  }, [fileTypeFilter, createdAtFilter, modifiedAtFilter, currentFolderId]);

  useEffect(() => {
    fetchData(currentFolderId);
    fetchFolderNames(folderPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId]);

  const fetchData = async (folderId: string | null) => {
    try {
      let foldersRes, filesRes;

      if (!folderId) {
        console.log('in shared page');
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
        console.log(foldersRes, filesRes);
      } else {
        console.log('in nested shared page');
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
      console.log(foldersRes, filesRes);
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
