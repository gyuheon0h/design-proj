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
import { colors, drawerStyles, activePageStyles, avatarStyles } from '../Styles';
import SettingsDialog from './SettingsDialog';
import CloudIcon from '@mui/icons-material/Cloud';

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
            marginRight: 2
          }}
        >
          {getInitials(username)}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body1" sx={{ color: colors.sidebarText, fontWeight: 500 }}>
            {username || 'Guest'}
          </Typography>
        </Box>
        <SettingsIcon fontSize="small" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
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

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {isLoggingOut && <Navigate to="/home" />}
    </React.Fragment>
  );
};

const NavigationDrawer = () => {
  const location = useLocation();
  const [storageUsed] = useState(5); // In GB
  const [totalStorage] = useState(15); // In GB
  const storagePercentage = (storageUsed / totalStorage) * 100;

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: drawerStyles.width,
        flexShrink: 0,
        '& .MuiDrawer-paper': drawerStyles.paper,
      }}
    >
      {/* Logo Section */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
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
        <Typography variant="h6" sx={{ 
          fontWeight: 600, 
          color: colors.sidebarText,
          marginLeft: '12px'
        }}>
          Owl Share
        </Typography>
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
              padding: '10px 16px',
              color: colors.sidebarText,
              ...(location.pathname === '/home' ? activePageStyles : {}),
              '&:hover': {
                backgroundColor: colors.sidebarHover,
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <StorageIcon sx={{ color: colors.sidebarText }} />
            </ListItemIcon>
            <ListItemText primary="Storage" />
          </ListItemButton>
        </ListItem>

        {/* Favorites */}
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            component={Link}
            to="/favorites"
            sx={{
              borderRadius: '8px',
              padding: '10px 16px',
              color: colors.sidebarText,
              ...(location.pathname === '/favorites' ? activePageStyles : {}),
              '&:hover': {
                backgroundColor: colors.sidebarHover,
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <StarIcon sx={{ color: colors.sidebarText }} />
            </ListItemIcon>
            <ListItemText primary="Favorites" />
          </ListItemButton>
        </ListItem>

        {/* Shared With Me */}
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            component={Link}
            to="/shared"
            sx={{
              borderRadius: '8px',
              padding: '10px 16px',
              color: colors.sidebarText,
              ...(location.pathname === '/shared' ? activePageStyles : {}),
              '&:hover': {
                backgroundColor: colors.sidebarHover,
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <PeopleIcon sx={{ color: colors.sidebarText }} />
            </ListItemIcon>
            <ListItemText primary="Shared with me" />
          </ListItemButton>
        </ListItem>

        {/* Trash */}
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            component={Link}
            to="/trash"
            sx={{
              borderRadius: '8px',
              padding: '10px 16px',
              color: colors.sidebarText,
              ...(location.pathname === '/trash' ? activePageStyles : {}),
              '&:hover': {
                backgroundColor: colors.sidebarHover,
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <DeleteIcon sx={{ color: colors.sidebarText }} />
            </ListItemIcon>
            <ListItemText primary="Trash" />
          </ListItemButton>
        </ListItem>
      </List>

      {/* Storage Info */}
      <Box sx={{ mt: 'auto', padding: '16px' }}>
        <Box sx={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.1)', 
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CloudIcon sx={{ color: colors.sidebarText, mr: 1, fontSize: 20 }} />
            <Typography variant="body2" sx={{ color: colors.sidebarText, fontWeight: 500 }}>
              My Storage
            </Typography>
          </Box>
          
          <Box sx={{ width: '100%', bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 5, height: 4, mb: 1 }}>
            <Box
              sx={{
                width: `${storagePercentage}%`,
                bgcolor: '#3B82F6',
                borderRadius: 5,
                height: '100%',
              }}
            />
          </Box>
          
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            You have used {storageUsed} GB out of {totalStorage} GB.
          </Typography>
        </Box>
        
        {/* Account Section */}
        <AccountMenu />
      </Box>
    </Drawer>
  );
};

export default NavigationDrawer;