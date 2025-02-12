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
import CreateButton from '../components/CreateButton';
import { useUser } from '../context/UserContext';
import { FileComponentProps } from '../components/File';

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userContext = useUser();

  const folderPath = location.pathname
    .replace('/home', '')
    .split('/')
    .filter(Boolean);
  const currentFolderId = folderPath.length
    ? folderPath[folderPath.length - 1]
    : null;

  const [folders, setFolders] = useState<FolderProps[]>([]);
  const [files, setFiles] = useState<FileComponentProps[]>([]);
  const [folderNames, setFolderNames] = useState<{ [key: string]: string }>({});
  const itemsPerPage = 5;

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
      console.log(
        'fileTypeFilter: ',
        fileTypeFilter,
        '; file.fileType: ',
        fileType,
      );
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
    fetchFolderNames(folderPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId]);

  // for filtering
  useEffect(() => {
    console.log('Current Filters:', {
      fileTypeFilter,
      createdAtFilter,
      modifiedAtFilter,
    });

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
    navigate(`/home/${[...folderPath, folder.id].join('/')}`);
  };

  const handleBreadcrumbClick = (index: number) => {
    navigate(`/home/${folderPath.slice(0, index + 1).join('/')}`);
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
          Your File Storage:
        </Typography>

        {/* Search Bar */}
        <SearchBar
          location="Storage"
          setFileTypeFilter={setFileTypeFilter}
          setCreatedAtFilter={setCreatedAtFilter}
          setModifiedAtFilter={setModifiedAtFilter}
        />

        {/* Breadcrumb Navigation */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
          }}
        >
          {['Home', ...folderPath].map((crumb, index) => (
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
              {index === 0 ? 'Home' : folderNames[crumb] || ''}
              {index < folderPath.length ? ' / ' : ''}
            </span>
          ))}
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', padding: '20px' }}>
        <div style={{ marginLeft: '10px' }}>
          <FolderContainer
            page="home"
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
            page={'home'}
            files={filteredFiles}
            currentFolderId={currentFolderId}
            refreshFiles={fetchData}
            username={userContext?.username || ''}
          />
        </div>
      </Box>
      <CreateButton
        currentFolderId={currentFolderId}
        refresh={fetchData}
      ></CreateButton>
    </Box>
  );
};

export default Home;
