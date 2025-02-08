import './App.css';
import { Routes, Route, useLocation } from 'react-router-dom';
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
          <Route path="/home/*?" element={<Home />} />
          <Route path="/favorites/*?" element={<Favorites />} />
          <Route path="/shared" element={<Shared />} />
          <Route path="/trash" element={<Trash />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
