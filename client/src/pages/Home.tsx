import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { FolderProp } from '../components/Folder';
import FileContainer from '../components/FileContainer';
import Divider from '@mui/material/Divider';
import axios from 'axios';
import FolderContainer from '../components/FolderContainer';

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const folderPath = location.pathname
    .replace('/home', '')
    .split('/')
    .filter(Boolean);
  const currentFolderId = folderPath.length
    ? folderPath[folderPath.length - 1]
    : null;

  const [folders, setFolders] = useState<FolderProp[]>([]);
  const [files, setFiles] = useState([]);
  const [folderNames, setFolderNames] = useState<{ [key: string]: string }>({});
  const itemsPerPage = 5;

  useEffect(() => {
    fetchData(currentFolderId);
    fetchFolderNames(folderPath);
  }, [currentFolderId]);

  const fetchData = async (folderId: string | null) => {
    try {
      const [foldersRes, filesRes] = await Promise.all([
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

  const handleFolderClick = (folder: FolderProp) => {
    navigate(`/home/${[...folderPath, folder.id].join('/')}`);
  };

  const handleBreadcrumbClick = (index: number) => {
    navigate(`/home/${folderPath.slice(0, index + 1).join('/')}`);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Your File Storage:</h1>
      <SearchBar location="Storage" />

      <div
        style={{
          marginBottom: '10px',
          paddingLeft: '0.6vw',
          paddingTop: '4vh',
        }}
      >
        {['Home', ...folderPath].map((crumb, index) => (
          <span
            key={index}
            onClick={() => handleBreadcrumbClick(index - 1)}
            style={{ cursor: 'pointer', marginRight: '5px' }}
          >
            {index === 0 ? 'Home' : folderNames[crumb] || ''}{' '}
            {index < folderPath.length ? ' > ' : ''}
          </span>
        ))}
      </div>

      <div style={{ marginLeft: '10px' }}>
        <FolderContainer
          folders={folders}
          onFolderClick={handleFolderClick}
          currentFolderId={currentFolderId}
          refreshFolders={fetchData}
          itemsPerPage={itemsPerPage}
        />
      </div>

      <Divider style={{ margin: '20px 0' }} />

      <div style={{ marginLeft: '10px' }}>
        <FileContainer
          files={files}
          currentFolderId={currentFolderId}
          refreshFiles={fetchData}
        />
      </div>
    </div>
  );
};

export default Home;
