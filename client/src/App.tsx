import './App.css';
import { Routes, Route, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Shared from './pages/Shared';
import NavigationDrawer from './components/Drawer';

function App() {
  const location = useLocation();
  const shouldShowDrawer = location.pathname !== '/'; // only don't show on login
  // TODO: add sign up page to above

  return (
    <div style={{ display: 'flex' }}>
      {shouldShowDrawer && <NavigationDrawer />}
      <div style={{ flexGrow: 1, paddingLeft: shouldShowDrawer ? 250 : 0 }}>
        {' '}
        {/* Adjust layout */}
        <Routes>
          <Route path="/" element={<Login/>} />
          <Route path="/home" element={<Home />} />
          <Route path="/shared" element={<Shared />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
