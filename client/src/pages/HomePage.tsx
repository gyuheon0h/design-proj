import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderProps } from '../components/Folder';
import axios from 'axios';
import Box from '@mui/material/Box';
import CreateButton from '../components/CreateButton';
import { useUser } from '../context/UserContext';
import { FileComponentProps } from '../components/File';
import {
  applyFilters,
  fetchFolderNames,
  useFilters,
  useFolderPath,
} from '../utils/helperRequests';
import PageComponent from '../components/Page';

const Home = () => {
  // const navigate = useNavigate();
  const userContext = useUser();
  // const { folderPath, currentFolderId } = useFolderPath('/home');

  // Local state for search query to allow manual search as well
  // const [searchQuery, setSearchQuery] = useState('');

  // const [folders, setFolders] = useState<FolderProps[]>([]);
  // const [files, setFiles] = useState<FileComponentProps[]>([]);
  // const [folderNames, setFolderNames] = useState<{ [key: string]: string }>({});

  // for filtering
  // const {
  //   filters,
  //   setFileTypeFilter,
  //   setCreatedAtFilter,
  //   setModifiedAtFilter,
  //   filteredFiles,
  //   setFilteredFiles,
  // } = useFilters();

  // useEffect(() => {
  //   fetchData(currentFolderId);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [currentFolderId, filters]);

  // for filtering on frontend
  // useEffect(() => {
  //   // Filter folders and files based on the selected filters
  //   setFilteredFiles(
  //     applyFilters(
  //       files,
  //       filters.fileType,
  //       filters.createdAt,
  //       filters.modifiedAt,
  //     ),
  //   );
  // }, [files, filters, setFilteredFiles]);

  // TODO: abstract this logic out???
  // useEffect(() => {
  //   const fetchNames = async () => {
  //     const names = await fetchFolderNames(folderPath);

  //     setFolderNames((prevNames) => {
  //       const isDifferent = folderPath.some(
  //         (id) => prevNames[id] !== names[id],
  //       );
  //       return isDifferent ? { ...prevNames, ...names } : prevNames;
  //     });
  //   };

  //   fetchNames();
  // }, [folderPath]); // Separate effect for folder names

  // const fetchData = async (folderId: string | null) => {
  //   const queryParams = new URLSearchParams();
  //   if (folderId) queryParams.append('folderId', folderId);
  //   if (filters.fileType) queryParams.append('fileType', filters.fileType);
  //   if (filters.createdAt) queryParams.append('createdAt', filters.createdAt);
  //   if (filters.modifiedAt)
  //     queryParams.append('lastModifiedAt', filters.modifiedAt);

  //   try {
  //     const [foldersRes, filesRes] = await Promise.all([
  //       axios.post(
  //         // 'http://localhost:5001/api/folder/parent',
  //         `http://localhost:5001/api/folder/parent?${queryParams.toString()}`,
  //         { folderId },
  //         { withCredentials: true },
  //       ),
  //       axios.post(
  //         // 'http://localhost:5001/api/file/folder',
  //         `http://localhost:5001/api/file/folder?${queryParams.toString()}`,
  //         { folderId },
  //         { withCredentials: true },
  //       ),
  //     ]);
  //     setFolders(foldersRes.data);
  //     setFiles(filesRes.data);
  //   } catch (error) {
  //     console.error('Error fetching data:', error);
  //   }
  // };

  // const handleFolderClick = (folder: FolderProps) => {
  //   navigate(`/home/${[...folderPath, folder.id].join('/')}`);
  // };

  // const handleBreadcrumbClick = (index: number) => {
  //   navigate(`/home/${folderPath.slice(0, index + 1).join('/')}`);
  // };

  // Handle local search input
  // const handleSearch = (query: string) => {
  //   setSearchQuery(query);
  // };

  // const handleFetchData = () => fetchData(currentFolderId);

  return (
    <PageComponent
      page="home"
      username={userContext?.username || ''}
      userId={userContext?.userId || ''}
    ></PageComponent>
    // <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
    //   {/* Sticky Header Section with Title, Breadcrumb, and Search Bar */}
    //   <Header
    //     title="Your File Storage:"
    //     location="Home"
    //     folderPath={folderPath}
    //     folderNames={folderNames}
    //     handleBreadcrumbClick={handleBreadcrumbClick}
    //     handleSearch={handleSearch}
    //     setFileTypeFilter={setFileTypeFilter}
    //     setCreatedAtFilter={setCreatedAtFilter}
    //     setModifiedAtFilter={setModifiedAtFilter}
    //   />

    //   {/* Scrollable Content */}
    //   <ContentComponent
    //     page="home"
    //     folders={folders}
    //     files={filteredFiles}
    //     onFolderClick={handleFolderClick}
    //     currentFolderId={currentFolderId}
    //     fetchData={handleFetchData}
    //     username={userContext?.username || ''}
    //     searchQuery={searchQuery}
    //   />

    //   <CreateButton currentFolderId={currentFolderId} refresh={fetchData} />
    // </Box>
  );
};

export default Home;
