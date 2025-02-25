import './App.css';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Login from './pages/LoginPage';
import Home from './pages/HomePage';
import Shared from './pages/SharedPage';
import Register from './pages/RegisterPage';
import NavigationDrawer from './components/Drawer';
import Favorites from './pages/FavoritesPage';
import Trash from './pages/TrashPage';
import { Fade } from '@mui/material';

function App() {
  const location = useLocation();
  const shouldShowDrawer =
    location.pathname !== '/' && location.pathname !== '/register';

  return (
    <div style={{ display: 'flex', overflowY: 'scroll' }}>
      {shouldShowDrawer && <NavigationDrawer />}
      <div style={{ flexGrow: 1 }}>
        <Fade in={true} timeout={500} key={location.pathname}>
          <div>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Login />} />
              <Route path="/home/*?" element={<Home />} />
              <Route path="/favorites/*?" element={<Favorites />} />
              <Route path="/shared/*?" element={<Shared />} />
              <Route path="/trash" element={<Trash />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </div>
        </Fade>
      </div>
    </div>
  );
}

export default App;
