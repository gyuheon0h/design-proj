import './App.css';
import { Routes, Route, useLocation } from 'react-router-dom';
import Login from './pages/LoginPage';
import Home from './pages/HomePage';
import Shared from './pages/SharedPage';
import Register from './pages/RegisterPage';
import NavigationDrawer from './components/Drawer';
import Favorites from './pages/FavoritesPage';
import Trash from './pages/TrashPage';
import { Fade } from '@mui/material';
import {
  Admin,
  Resource,
  ListGuesser,
  EditGuesser,
  ShowGuesser,
} from "react-admin"; // do i need admin?
import { GoogleAuthContextProvider, useGoogleAuthProvider } from 'ra-auth-google';

function App() {
  const location = useLocation();
  const shouldShowDrawer =
    location.pathname !== '/' && location.pathname !== '/register';
  const { gsiParams } = useGoogleAuthProvider({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID, // need to figure out how to configure .env
  });

  return (
    <GoogleAuthContextProvider value={gsiParams}>
      {/* TODO: what exactly does admin do? */}
      <Admin> 
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
      </Admin>
    </GoogleAuthContextProvider>
  );
}

export default App;
