import Divider from '@mui/material/Divider';
import SearchBar from '../components/SearchBar';
import FileContainer from '../components/FileContainer';
import FolderContainer from '../components/FolderContainer';

const Home = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Your File Storage:</h1>
      <SearchBar location="Storage" />
      <h2>Folder</h2>
      {/* <FileContainer></FileContainer> */}
      <Divider></Divider>
      <h2>Files</h2>
      {/* <FolderContainer></FolderContainer> */}
    </div>
  );
};

export default Home;
