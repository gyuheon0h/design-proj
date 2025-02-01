import Divider from '@mui/material/Divider';
import SearchBar from '../components/SearchBar';

import { useParams } from 'react-router-dom';

const FolderPage = () => {
  const { folderID } = useParams(); // Get folderID from URL

  return (
    <div style={{ padding: '20px' }}>
      <h1>Folder ID: {folderID}</h1>
      <h1>Root-Folder1-{folderID}(breadcrumbs)</h1>
      <SearchBar location="" />
      <h2>Folders</h2>
      {/* <FileContainer></FileContainer> */}
      <Divider></Divider>
      <h2>Files</h2>
      {/* <FolderContainer></FolderContainer> */}
    </div>
  );
};

export default FolderPage;
