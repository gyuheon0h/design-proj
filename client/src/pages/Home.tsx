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

  // Extract folder path from URL
  const folderPath = location.pathname
    .replace('/home', '')
    .split('/')
    .filter(Boolean);
  const currentFolderId = folderPath.length
    ? folderPath[folderPath.length - 1]
    : null; // Last part of the path

  const [folders, setFolders] = useState<FolderProp[]>([]);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchData(currentFolderId);
  }, [currentFolderId, location.pathname]); // Runs when folder changes

  const fetchData = async (folderId: string | null) => {
    try {
      // Fetch folders & files inside the current folder
      const [foldersRes, filesRes] = await Promise.all([
        axios.get(`http://localhost:5001/api/folder/parent/${folderId}`, {
          withCredentials: true,
        }),
        axios.get(`http://localhost:5001/api/file/folder/${folderId}`, {
          withCredentials: true,
        }),
      ]);
      setFolders(foldersRes.data);
      setFiles(filesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleFolderClick = (folder: FolderProp) => {
    navigate(`/home/${[...folderPath, folder.id].join('/')}`); // Append folder ID to path
  };

  const handleBreadcrumbClick = (index: number) => {
    navigate(`/home/${folderPath.slice(0, index + 1).join('/')}`);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Your File Storage:</h1>
      <SearchBar location="Storage" />

      {/* Breadcrumb Navigation */}
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
            {crumb} {index < folderPath.length ? '>' : ''}
          </span>
        ))}
      </div>

      {/* Folders Section */}
      <div style={{ marginLeft: '10px' }}>
        <FolderContainer
          folders={folders}
          onFolderClick={handleFolderClick}
          currentFolderId={currentFolderId}
        />
      </div>

      <Divider style={{ margin: '20px 0' }} />

      {/* Files Section */}
      <div style={{ marginLeft: '10px' }}>
        <FileContainer files={files} currentFolderId={currentFolderId} />
      </div>
    </div>
  );
};

export default Home;
