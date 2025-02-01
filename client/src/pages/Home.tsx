import Folder from '../components/Folder';
import Divider from '@mui/material/Divider';
import SearchBar from '../components/SearchBar';
import FileContainer from '../components/FileContainer';
import FolderContainer from '../components/FolderContainer';

const Home = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Your File Storage:</h1>
      <SearchBar location="Storage" />
      <h2>Folders</h2>
      <Folder
        id="id"
        name="Folder"
        owner="Jake"
        createdAt={new Date('2025-01-31')}
        parentFolder={null}
        folderChildren={[]}
        fileChildren={[]}
      />
      {/* <FileContainer></FileContainer> */}
      <Divider style={{ padding: '20px' }}></Divider>
      <h2>Files</h2>
      {/* <FolderContainer></FolderContainer> */}
    </div>
  );
};

export default Home;
