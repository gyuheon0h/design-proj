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
import { File } from '../interfaces/File';
import { Box, Divider, Typography } from '@mui/material';
import { typography } from '../Styles';
import SearchBar from './SearchBar';
import CreateButton from './CreateButton';
import FileContainer from './FileContainer';
import FolderContainer from './FolderContainer';
import { useStorage } from '../context/StorageContext';
import { uploadEventTarget } from './UploadProgress';

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

  const { fetchStorageUsed } = useStorage();

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

  // for listening for uploads on the current folder to refresh files when needed
  useEffect(() => {
    const handler = (e: Event) => {
      const folderId = (e as CustomEvent).detail.folderId;
      if (folderId === currentFolderId) {
        fetchFileData(currentFolderId);
      }
    };

    uploadEventTarget.addEventListener('upload-complete', handler);
    return () => {
      uploadEventTarget.removeEventListener('upload-complete', handler);
    };
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

  const handleFolderClick = (folder: Folder) => {
    if (page !== 'trash') {
      navigate(`/${page}/${[...folderPath, folder.id].join('/')}`);
    } else {
      //TODO: Alert user that they cannot navigate into folders that have been trashed
    }
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
        filesRes = await axios.get(
          // `http://localhost:5001/api/user/${userId}/${page}/file`,
          `${process.env.REACT_APP_API_BASE_URL}/api/user/${userId}/${page}/file`,
          { withCredentials: true },
        );
      } else {
        filesRes = await axios.get(
          // 'http://localhost:5001/api/folder/parent',
          // `http://localhost:5001/api/file/parent/${folderId}`,
          `${process.env.REACT_APP_API_BASE_URL}/api/file/parent/${folderId}`,
          { withCredentials: true },
        );
      }

      setFiles(filesRes?.data);
    } catch (error) {
      console.error('Error fetching file data:', error);
    }
  };

  const fetchFolderData = async (folderId: string | null) => {
    try {
      let folderRes;
      if (!folderId) {
        folderRes = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/user/${userId}/${page}/folder`,
          { withCredentials: true },
        );
      } else {
        folderRes = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/folder/parent/${folderId}`,
          { withCredentials: true },
        );
      }
      // console.log(folderRes);
      setFolders(folderRes?.data);
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
          {page.charAt(0).toUpperCase() + page.substring(1)}
        </Typography>

        <Box sx={{ marginLeft: '10px' }}>
          <SearchBar
            location={page.charAt(0).toUpperCase() + page.substring(1)}
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
            fontSize: '14px',
            marginLeft: '6px',
            paddingTop: '30px',
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
                marginLeft: '4px',
              }}
            >
              {index === 0
                ? page.charAt(0).toUpperCase() + page.substring(1)
                : folderNames[crumb] || ''}
              {index < folderPath.length ? ' /     ' : ''}
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
      {(page === 'home' || currentFolderId) && (
        <CreateButton
          currentFolderId={currentFolderId}
          refreshFiles={fetchFileData}
          refreshFolders={fetchFolderData}
          refreshStorage={fetchStorageUsed}
        ></CreateButton>
      )}
    </Box>
  );
};

export default PageComponent;
