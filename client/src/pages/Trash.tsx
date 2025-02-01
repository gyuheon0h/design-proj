import Divider from '@mui/material/Divider';
import SearchBar from '../components/SearchBar';

const Trash = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Trash Bin:</h1>
      <SearchBar location="Trash" /> <h2>Folders</h2>
      <Divider style={{ padding: '20px' }}></Divider>
      <h2>Files</h2>
    </div>
  );
};

export default Trash;
