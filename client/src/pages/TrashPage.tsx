import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { FileComponentProps } from '../components/File';
import { FolderProps } from '../components/Folder';
import Header from '../components/HeaderComponent';
import ContentComponent from '../components/Content';
import { applyFilters, useFilters } from '../utils/helperRequests';
import PageComponent from '../components/Page';

const Trash = () => {
  const userContext = useUser();

  // // Local state for search query
  // const [searchQuery, setSearchQuery] = useState('');

  // const [folders, setFolders] = useState<FolderProps[]>([]);
  // const [files, setFiles] = useState<FileComponentProps[]>([]);

  // // for filtering
  // const {
  //   filters,
  //   setFileTypeFilter,
  //   setCreatedAtFilter,
  //   setModifiedAtFilter,
  //   filteredFiles,
  //   setFilteredFiles,
  // } = useFilters();

  // useEffect(() => {
  //   fetchData();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [filters]);

  // // for filtering on frontend
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

  // const fetchData = async () => {
  //   try {
  //     const [foldersRes, filesRes] = await Promise.all([
  //       axios.get('http://localhost:5001/api/folder/trash', {
  //         withCredentials: true,
  //       }),
  //       axios.get('http://localhost:5001/api/file/trash', {
  //         withCredentials: true,
  //       }),
  //     ]);
  //     setFolders(foldersRes.data);
  //     setFiles(filesRes.data);
  //   } catch (error) {
  //     console.error('Error fetching data:', error);
  //   }
  // };

  // // Handle search input
  // const handleSearch = (query: string) => {
  //   setSearchQuery(query);
  // };

  return (
    <PageComponent
      page="trash"
      username={userContext?.username || ''}
      userId={userContext?.userId || ''}
    ></PageComponent>
    // <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
    //   {/* Sticky Header Section with Title, Search Bar */}
    //   <Header
    //     title="Trash Bin:"
    //     location="Trash Bin"
    //     folderPath={[]}
    //     folderNames={{}}
    //     handleBreadcrumbClick={() => {}}
    //     handleSearch={handleSearch}
    //     setFileTypeFilter={setFileTypeFilter}
    //     setCreatedAtFilter={setCreatedAtFilter}
    //     setModifiedAtFilter={setModifiedAtFilter}
    //   />

    //   {/* Scrollable Content */}
    //   <ContentComponent
    //     page="trash"
    //     folders={folders}
    //     files={filteredFiles}
    //     onFolderClick={() => alert('You cannot view folders in the trash bin.')}
    //     currentFolderId={null}
    //     fetchData={fetchData}
    //     username={userContext?.username || ''}
    //     searchQuery={searchQuery}
    //   />
    // </Box>
  );
};

export default Trash;
