import './App.css';
import { Routes, Route, useLocation } from 'react-router-dom';
import Login from './pages/LoginPage';
import Home from './pages/HomePage';
import Shared from './pages/SharedPage';
import Register from './pages/RegisterPage';
import NavigationDrawer from './components/Drawer';
import Favorites from './pages/FavoritesPage';
import Trash from './pages/TrashPage';
import { Fade, Box } from '@mui/material';
import { colors } from './Styles';

function App() {
  const location = useLocation();
  const shouldShowDrawer =
    location.pathname !== '/' && location.pathname !== '/register';

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        height: '100vh',
        bgcolor: shouldShowDrawer ? colors.mainBackground : '#FFFFFF',
        overflow: 'hidden',
      }}
    >
      {shouldShowDrawer && <NavigationDrawer />}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Fade in={true} timeout={300} key={location.pathname}>
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Login />} />
              <Route path="/home/*" element={<Home />} />
              <Route path="/favorites/*" element={<Favorites />} />
              <Route path="/shared/*" element={<Shared />} />
              <Route path="/trash" element={<Trash />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </Box>
        </Fade>
      </Box>
    </Box>
  );
}

export default App;