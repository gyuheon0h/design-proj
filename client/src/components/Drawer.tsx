import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
  Typography,
  Menu,
  MenuItem,
  Box,
  Avatar,
  IconButton,
} from '@mui/material';
import { Link, Navigate, useLocation } from 'react-router-dom';
import StorageIcon from '@mui/icons-material/Storage';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import DeleteIcon from '@mui/icons-material/Delete';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import {
  colors,
  drawerStyles,
  activePageStyles,
  avatarStyles,
} from '../Styles';
import SettingsDialog from './SettingsDialog';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import StorageAnalytics from './StorageAnalytics';

const AccountMenu = () => {
  const { username } = useUser();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
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

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <React.Fragment>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          cursor: 'pointer',
          borderRadius: '8px',
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
        }}
        onClick={handleClick}
      >
        <Avatar
          sx={{
            ...avatarStyles.standard,
            bgcolor: colors.avatar,
            color: colors.avatarText,
            marginRight: 2,
          }}
        >
          {getInitials(username)}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="body1"
            sx={{ color: colors.sidebarText, fontWeight: 500 }}
          >
            {username || 'Guest'}
          </Typography>
        </Box>
        <SettingsIcon
          fontSize="small"
          sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
        />
      </Box>

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
        <MenuItem onClick={handleLogout} sx={{ color: 'red' }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" sx={{ color: 'red' }} />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {settingsOpen && (
        <SettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {isLoggingOut && <Navigate to="/home" />}
    </React.Fragment>
  );
};

const NavigationDrawer = () => {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const toggleDrawer = () => setDrawerOpen(!drawerOpen);

  return (
    <Drawer
      variant="permanent"
      open={drawerOpen}
      sx={{
        width: drawerOpen ? drawerStyles.width : 60,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          ...drawerStyles.paper,
          width: drawerOpen ? drawerStyles.width : 60,
          transition: 'width 0.3s',
          overflowX: 'hidden',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: drawerOpen ? 'flex-end' : 'center',
          p: 1,
        }}
      >
        <IconButton onClick={toggleDrawer}>
          {drawerOpen ? (
            <ChevronLeftIcon sx={{ color: 'white' }} />
          ) : (
            <MenuIcon sx={{ color: 'white' }} />
          )}
        </IconButton>
      </Box>

      {/* Logo Section */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: drawerOpen ? 'flex-start' : 'center',
          padding: '24px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Box
          component="img"
          src="/owl_icon.png"
          alt="Owl Logo"
          sx={{ width: 32, height: 32 }}
        />
        {drawerOpen && (
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: colors.sidebarText,
              marginLeft: '12px',
              transition: 'opacity 0.3s',
            }}
          >
            Owl Share
          </Typography>
        )}
      </Box>

      {/* Navigation List */}
      <List sx={{ padding: '16px' }}>
        {/* Storage */}
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            component={Link}
            to="/home"
            sx={{
              borderRadius: '8px',
              padding: drawerOpen ? '10px 16px' : '10px 0',
              color: colors.sidebarText,
              justifyContent: drawerOpen ? 'flex-start' : 'center',
              ...(location.pathname === '/home' ? activePageStyles : {}),
              '&:hover': {
                backgroundColor: colors.sidebarHover,
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: drawerOpen ? 40 : 'auto',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <StorageIcon sx={{ color: colors.sidebarText }} />
            </ListItemIcon>
            {drawerOpen && (
              <ListItemText
                primary="Storage"
                sx={{ transition: 'opacity 0.3s' }}
              />
            )}
          </ListItemButton>
        </ListItem>

        {/* Favorites */}
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            component={Link}
            to="/favorites"
            sx={{
              borderRadius: '8px',
              padding: drawerOpen ? '10px 16px' : '10px 0',
              color: colors.sidebarText,
              justifyContent: drawerOpen ? 'flex-start' : 'center',
              ...(location.pathname === '/favorites' ? activePageStyles : {}),
              '&:hover': {
                backgroundColor: colors.sidebarHover,
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: drawerOpen ? 40 : 'auto',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <StarIcon sx={{ color: colors.sidebarText }} />
            </ListItemIcon>
            {drawerOpen && (
              <ListItemText
                primary="Favorites"
                sx={{ transition: 'opacity 0.3s' }}
              />
            )}
          </ListItemButton>
        </ListItem>

        {/* Shared With Me */}
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            component={Link}
            to="/shared"
            sx={{
              borderRadius: '8px',
              padding: drawerOpen ? '10px 16px' : '10px 0',
              color: colors.sidebarText,
              justifyContent: drawerOpen ? 'flex-start' : 'center',
              ...(location.pathname === '/shared' ? activePageStyles : {}),
              '&:hover': {
                backgroundColor: colors.sidebarHover,
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: drawerOpen ? 40 : 'auto',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <PeopleIcon sx={{ color: colors.sidebarText }} />
            </ListItemIcon>
            {drawerOpen && (
              <ListItemText
                primary="Shared With Me"
                sx={{ transition: 'opacity 0.3s' }}
              />
            )}
          </ListItemButton>
        </ListItem>

        {/* Trash */}
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            component={Link}
            to="/trash"
            sx={{
              borderRadius: '8px',
              padding: drawerOpen ? '10px 16px' : '10px 0',
              color: colors.sidebarText,
              justifyContent: drawerOpen ? 'flex-start' : 'center',
              ...(location.pathname === '/trash' ? activePageStyles : {}),
              '&:hover': {
                backgroundColor: colors.sidebarHover,
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: drawerOpen ? 40 : 'auto',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <DeleteIcon sx={{ color: colors.sidebarText }} />
            </ListItemIcon>
            {drawerOpen && (
              <ListItemText
                primary="Trash"
                sx={{ transition: 'opacity 0.3s' }}
              />
            )}
          </ListItemButton>
        </ListItem>
      </List>

      {drawerOpen && <StorageAnalytics />}
      {/* Account Section */}
      <AccountMenu />
    </Drawer>
  );
};

export default NavigationDrawer;
