import './App.css';
import { Routes, Route, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Shared from './pages/Shared';
import Register from './pages/Register';
import NavigationDrawer from './components/Drawer';
import Favorites from './pages/Favorites';
import Trash from './pages/Trash';
import Folder from './pages/Folder';

function App() {
  const location = useLocation();
  const shouldShowDrawer =
    location.pathname !== '/' && location.pathname !== '/register'; // only don't show on login
  // TODO: add sign up page to above

  return (
    <div style={{ display: 'flex', overflowY: 'scroll' }}>
      {shouldShowDrawer && <NavigationDrawer />}
      <div style={{ flexGrow: 1 }}>
        {' '}
        {/* Adjust layout */}
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/shared" element={<Shared />} />
          <Route path="/trash" element={<Trash />} />
          <Route path="/register" element={<Register />} />
          <Route path="/folder/:folderID" element={<Folder />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
