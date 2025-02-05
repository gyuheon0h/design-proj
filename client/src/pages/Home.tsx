import React, { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import { FolderProp } from '../components/Folder';
import FileContainer from '../components/FileContainer';
import Divider from '@mui/material/Divider';
import axios from 'axios';
import FolderContainer from '../components/FolderContainer';

const Home = () => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null); // Root folder
  const [folders, setFolders] = useState<FolderProp[]>([]);
  const [files, setFiles] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState<
    { id: string | null; name: string }[]
  >([{ id: null, name: 'Home' }]);

  useEffect(() => {
    fetchData(currentFolderId);
  }, [currentFolderId]);

  const fetchData = async (folderId: string | null) => {
    try {
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
    setBreadcrumbs((prevBreadcrumbs) => [
      ...prevBreadcrumbs,
      { id: folder.id, name: folder.name },
    ]);

    setCurrentFolderId(folder.id);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    setCurrentFolderId(newBreadcrumbs[newBreadcrumbs.length - 1].id);
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
        {breadcrumbs.map((crumb, index) => (
          <span
            key={crumb.id}
            onClick={() => handleBreadcrumbClick(index)}
            style={{ cursor: 'pointer', marginRight: '5px' }}
          >
            {crumb.name} {index < breadcrumbs.length - 1 ? '>' : ''}
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
