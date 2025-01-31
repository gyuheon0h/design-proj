import Divider from '@mui/material/Divider';
import SearchBar from '../components/SearchBar';

const Favorites = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Your Favorites:</h1>
      <SearchBar location="Favorites" />
      <h2>Folder</h2>
      <Divider></Divider>
      <h2>Files</h2>
    </div>
  );
};

export default Favorites;
