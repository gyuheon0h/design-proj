import { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import FileContainer from '../components/FileContainer';
import FolderContainer from '../components/FolderContainer';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import axios from 'axios';
import { typography } from '../Styles';
import { useUser } from '../context/UserContext';
import { FileComponentProps } from '../components/File';
import { FolderProps } from '../components/Folder';

interface TrashProps {
  searchQuery: string;
}

const Trash: React.FC<TrashProps> = ({ searchQuery: externalSearchQuery }) => {
  const userContext = useUser();

  // Local state for search query
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  // Use external search query if provided, otherwise use local search query
  const searchQuery = externalSearchQuery || localSearchQuery;

  const [folders, setFolders] = useState<FolderProps[]>([]);
  const [files, setFiles] = useState<FileComponentProps[]>([]);

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

  // for filtering
  useEffect(() => {
    console.log('Current Filters:', {
      fileTypeFilter,
      createdAtFilter,
      modifiedAtFilter,
    });

    fetchData();
  }, [fileTypeFilter, createdAtFilter, modifiedAtFilter]);

  const fetchData = async () => {
    try {
      const [foldersRes, filesRes] = await Promise.all([
        axios.get('http://localhost:5001/api/folder/trash', {
          withCredentials: true,
        }),
        axios.get('http://localhost:5001/api/file/trash', {
          withCredentials: true,
        }),
      ]);
      setFolders(foldersRes.data);
      setFiles(filesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Handle search input
  const handleSearch = (query: string) => {
    setLocalSearchQuery(query);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Header Section with Title, Search Bar */}
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
            paddingBottom: '15px',
          }}
        >
          Trash Bin:
        </Typography>

        {/* SearchBar added here */}
        <Box sx={{ marginLeft: '10px' }}>
          <SearchBar
            location="Trash Bin"
            onSearch={handleSearch}
            setFileTypeFilter={setFileTypeFilter}
            setCreatedAtFilter={setCreatedAtFilter}
            setModifiedAtFilter={setModifiedAtFilter}
          />
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', padding: '20px' }}>
        {/* Folders Section */}
        <div style={{ marginLeft: '10px' }}>
          <FolderContainer
            page="trash"
            folders={folders}
            onFolderClick={() => {
              alert('You cannot view folders in the trash bin.');
            }}
            currentFolderId={null}
            refreshFolders={fetchData}
            itemsPerPage={5}
            username={userContext?.username || ''}
            searchQuery={searchQuery}
          />
        </div>

        <Divider style={{ margin: '20px 0' }} />

        {/* Files Section */}
        <div style={{ marginLeft: '10px' }}>
          <FileContainer
            page="trash"
            files={filteredFiles}
            currentFolderId={null}
            refreshFiles={fetchData}
            username={userContext?.username || ''}
            searchQuery={searchQuery}
          />
        </div>
      </Box>

      <Divider sx={{ margin: '20px 0' }} />
    </Box>
  );
};

export default Trash;
