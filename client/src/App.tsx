import './App.css';
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Shared from './pages/Shared';
import NavigationDrawer from './components/Drawer';

function App() {
  const location = useLocation();
  const shouldShowDrawer =
    location.pathname === '/home' || location.pathname === '/shared';

  return (
    <div style={{ display: 'flex' }}>
      {shouldShowDrawer && <NavigationDrawer />}
      <div style={{ flexGrow: 1, paddingLeft: shouldShowDrawer ? 250 : 0 }}>
        {' '}
        {/* Adjust layout */}
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/home" element={<Home />} />
          <Route path="/shared" element={<Shared />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
