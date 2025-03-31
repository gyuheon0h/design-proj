import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
  Typography,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Fade,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Link, Navigate, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import DeleteIcon from '@mui/icons-material/Delete';
import LogoutIcon from '@mui/icons-material/Logout';
import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { colors, drawerStyles, activePageStyles, typography } from '../Styles';
import SettingsDialog from './SettingsDialog';

const AccountMenu = () => {
  const { username } = useUser();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    try {
      document.cookie.split(';').forEach((cookie) => {
        const [name] = cookie.split('=');
        document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      });
      window.location.reload();
      window.location.replace('/');
    } catch (error) {
      console.error('Error during logout:', error);
      window.location.replace('/');
    }
  };

  return (
    <React.Fragment>
      <Tooltip title="Account settings">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ ml: 2 }}
          aria-controls={open ? 'account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Avatar sx={{ width: 32, height: 32 }}>
            {username ? username.charAt(0).toUpperCase() : '?'}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        sx={{ mt: -6 }}
      >
        <MenuItem onClick={handleClose}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            Logged in as: {username || 'Guest'}
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ color: 'red' }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" sx={{ color: 'red' }} />
          </ListItemIcon>
          Logout
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose();
            setSettingsOpen(true);
          }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
      </Menu>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {isLoggingOut && (
        <Fade in={true} timeout={500}>
          <Navigate to="/home" />
        </Fade>
      )}
    </React.Fragment>
  );
};

const NavigationDrawer = () => {
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const toggleDrawer = () => setOpen(!open);

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? drawerStyles.width : 64,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        transition: (theme) =>
          theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        '& .MuiDrawer-paper': {
          width: open ? drawerStyles.width : 64,
          overflowX: 'hidden',
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1 }}>
        <IconButton onClick={toggleDrawer}>
          {open ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Box>

      {/* Logo Section */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '15px 0px',
          gap: 1,
        }}
      >
        <Box
          component="img"
          src="/owl_icon.png"
          alt="Owl Logo"
          sx={{ width: 64, height: 64 }}
        />
        <Typography variant="h1" sx={{ fontFamily: typography.fontFamily }}>
          Owl Share
        </Typography>
      </Box>

      {/* Navigation List */}
      <List>
        {/* Home */}
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/home"
            sx={{
              border: `2px solid ${colors.lightBlue}`,
              borderRadius: '10px',
              padding: '10px 16px',
              marginBottom: '10px',
              '&:hover': { backgroundColor: colors.hover },
              ...(location.pathname === '/home' ? activePageStyles : {}),
            }}
          >
            <ListItemIcon>
              <HomeIcon sx={{ color: colors.darkBlue }} />
            </ListItemIcon>
            <ListItemText primary="Home" sx={{ opacity: open ? 1 : 0 }} />
          </ListItemButton>
        </ListItem>

        {/* Favorites */}
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/favorites"
            sx={{
              border: `2px solid ${colors.lightBlue}`,
              borderRadius: '10px',
              padding: '10px 16px',
              marginBottom: '10px',
              '&:hover': { backgroundColor: colors.hover },
              ...(location.pathname === '/favorites' ? activePageStyles : {}),
            }}
          >
            <ListItemIcon>
              <StarIcon sx={{ color: colors.darkBlue }} />
            </ListItemIcon>
            <ListItemText primary="Favorites" sx={{ opacity: open ? 1 : 0 }} />
          </ListItemButton>
        </ListItem>

        {/* Shared With Me */}
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/shared"
            sx={{
              border: `2px solid ${colors.lightBlue}`,
              borderRadius: '10px',
              padding: '10px 16px',
              marginBottom: '10px',
              '&:hover': { backgroundColor: colors.hover },
              ...(location.pathname === '/shared' ? activePageStyles : {}),
            }}
          >
            <ListItemIcon>
              <PeopleIcon sx={{ color: colors.darkBlue }} />
            </ListItemIcon>
            <ListItemText
              primary="Shared With Me"
              sx={{ opacity: open ? 1 : 0 }}
            />
          </ListItemButton>
        </ListItem>

        {/* Trash */}
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/trash"
            sx={{
              border: `2px solid ${colors.lightBlue}`,
              borderRadius: '10px',
              padding: '10px 16px',
              marginBottom: '10px',
              '&:hover': { backgroundColor: colors.hover },
              ...(location.pathname === '/trash' ? activePageStyles : {}),
            }}
          >
            <ListItemIcon>
              <DeleteIcon sx={{ color: colors.darkBlue }} />
            </ListItemIcon>
            <ListItemText primary="Trash" sx={{ opacity: open ? 1 : 0 }} />
          </ListItemButton>
        </ListItem>
      </List>

      {/* Avatar with logout functionality */}
      <Box sx={{ mt: 'auto', padding: '10px' }}>
        <AccountMenu />
      </Box>
    </Drawer>
  );
};

export default NavigationDrawer;
