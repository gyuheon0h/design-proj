import { useEffect, useState } from 'react';
import { Folder } from '../interfaces/Folder';
import axios from 'axios';
import {
  applyFilters,
  fetchFolderNames,
  useFilters,
  useFolderPath,
} from '../utils/helperRequests';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { File } from '../interfaces/File';
import { Box, Divider, Typography } from '@mui/material';
import { typography } from '../Styles';
import SearchBar from './SearchBar';
import CreateButton from './CreateButton';
import FileContainer from './FileContainer';
import FolderContainer from './FolderContainer';

interface PageComponentProps {
  page: 'home' | 'shared' | 'favorites' | 'trash';
  username: string;
  userId: string;
}

const PageComponent: React.FC<PageComponentProps> = ({
  page,
  username,
  userId,
}) => {
  const navigate = useNavigate();
  //   const userContext = useUser();
  const { folderPath, currentFolderId } = useFolderPath(`/${page}`);

  const [searchQuery, setSearchQuery] = useState('');

  const [files, setFiles] = useState<File[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderNames, setFolderNames] = useState<{ [key: string]: string }>({});

  const {
    filters,
    setFileTypeFilter,
    setCreatedAtFilter,
    setModifiedAtFilter,
    filteredFiles,
    setFilteredFiles,
  } = useFilters();

  useEffect(() => {
    fetchFolderData(currentFolderId);
    fetchFileData(currentFolderId);
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
  }, [folderPath]);

  const handleFolderClick = (folder: Folder) => {
    navigate(`/${page}/${[...folderPath, folder.id].join('/')}`);
  };

  const handleBreadcrumbClick = (index: number) => {
    navigate(`/${page}/${folderPath.slice(0, index + 1).join('/')}`);
  };

  // Handle local search input
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const fetchFileData = async (folderId: string | null) => {
    try {
      let filesRes;

      if (!folderId) {
        filesRes = await axios.post(
          // 'http://localhost:5001/api/folder/parent',
          `http://localhost:5001/api/user/${userId}/${page}/file`,
          { withCredentials: true },
        );
      } else {
        filesRes = await axios.post(
          // 'http://localhost:5001/api/folder/parent',
          `http://localhost:5001/api/folder/parent?${folderId}`,
          { folderId },
          { withCredentials: true },
        );
      }

      setFiles(filesRes.data);
    } catch (error) {
      console.error('Error fetching file data:', error);
    }
  };

  const fetchFolderData = async (folderId: string | null) => {
    try {
      let folderRes;

      if (!folderId) {
        folderRes = await axios.post(
          // 'http://localhost:5001/api/folder/parent',
          `http://localhost:5001/api/user/${userId}/${page}/folder`,
          { withCredentials: true },
        );
      } else {
        folderRes = await axios.post(
          // 'http://localhost:5001/api/folder/parent',
          `http://localhost:5001/api/folder/parent?${folderId}`,
          { withCredentials: true },
        );
      }

      setFolders(folderRes.data);
    } catch (error) {
      console.error('Error fetching folder data:', error);
    }
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
          {page}
        </Typography>

        <Box sx={{ marginLeft: '10px' }}>
          <SearchBar
            location={page}
            onSearch={handleSearch}
            setFileTypeFilter={setFileTypeFilter}
            setCreatedAtFilter={setCreatedAtFilter}
            setModifiedAtFilter={setModifiedAtFilter}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
          }}
        >
          {[page, ...folderPath].map((crumb, index) => (
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
              {index === 0 ? page : folderNames[crumb] || ''}
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
            page={page}
            folders={folders}
            onFolderClick={handleFolderClick}
            currentFolderId={currentFolderId}
            refreshFolders={fetchFolderData}
            username={username}
            searchQuery={searchQuery}
          />
        </div>

        <Divider style={{ margin: '20px 0' }} />

        <div style={{ marginLeft: '10px' }}>
          <FileContainer
            page={page}
            files={filteredFiles}
            currentFolderId={currentFolderId}
            refreshFiles={fetchFileData}
            username={username}
            searchQuery={searchQuery}
          />
        </div>
      </Box>

      {/* Create Button */}
      {currentFolderId && (
        <CreateButton
          currentFolderId={currentFolderId}
          refreshFiles={fetchFileData}
          refreshFolders={fetchFolderData}
        ></CreateButton>
      )}
    </Box>
  );
};

export default PageComponent;
