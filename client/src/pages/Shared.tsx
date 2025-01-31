import Divider from '@mui/material/Divider';
import SearchBar from '../components/SearchBar';

const Shared = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Shared With Me:</h1>
      <SearchBar location="Shared" />
      <h2>Folders</h2>
      <Divider></Divider>
      <h2>Files</h2>
    </div>
  );
};

export default Shared;
