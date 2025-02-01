import Divider from '@mui/material/Divider';
import SearchBar from '../components/SearchBar';

import { useParams } from 'react-router-dom';

const FolderPage = () => {
  const { folderID } = useParams();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Folder ID: {folderID}</h1>
      <h1>Root-Folder1-{folderID}(breadcrumbs)</h1>
      <SearchBar location="folderID" />{' '}
      {/* need to get convert to readable folder name */}
      <h2>Folders</h2>
      {/* <FileContainer></FileContainer> */}
      <Divider style={{ padding: '20px' }}></Divider> <h2>Files</h2>
      {/* <FolderContainer></FolderContainer> */}
    </div>
  );
};

export default FolderPage;
