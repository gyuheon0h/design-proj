import Divider from '@mui/material/Divider';
import SearchBar from '../components/SearchBar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { typography } from '../Styles';

const Trash = () => {
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Header Section with Title and Search Bar */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          left: 0,
          backgroundColor: 'white',
          zIndex: 1000,
          padding: '15px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Title */}
        <Typography
          variant="h1"
          sx={{
            fontWeight: 'bold',
            fontFamily: typography.fontFamily, 
            fontSize: typography.fontSize.extraLarge, 
            color: '#161C94', 
            marginLeft: '10px',
            paddingTop: '25px',
            paddingBottom: '30px',
          }}
        >
          Trash Bin:
        </Typography>

        {/* Search Bar */}
        <SearchBar location="Trash" />
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', padding: '20px' }}>
        {/* Folders Section */}
        <Box sx={{ marginLeft: '10px' }}>
          <Typography variant="h2" sx={{ fontSize: typography.fontSize.extraLarge, fontWeight: 'bold' }}>
            Folders
          </Typography>
        </Box>

        <Divider sx={{ margin: '20px 0' }} />

        {/* Files Section */}
        <Box sx={{ marginLeft: '10px' }}>
          <Typography variant="h2" sx={{ fontSize: typography.fontSize.extraLarge, fontWeight: 'bold' }}>
            Files
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Trash;
