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

function App() {
  const location = useLocation();
  const shouldShowDrawer =
    location.pathname !== '/' && location.pathname !== '/register';

  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div style={{ display: 'flex', overflowY: 'scroll' }}>
      {shouldShowDrawer && <NavigationDrawer />}
      <div style={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home/*?" element={<Home searchQuery={searchQuery} />} />
          <Route
            path="/favorites/*?"
            element={<Favorites searchQuery={searchQuery} />}
          />
          <Route path="/shared" element={<Shared searchQuery={searchQuery} />} />
          <Route path="/trash" element={<Trash searchQuery={searchQuery} />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
