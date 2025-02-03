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
  Avatar
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import DeleteIcon from '@mui/icons-material/Delete';
import LogoutIcon from '@mui/icons-material/Logout';
import React, { useState } from 'react';
import { useUser } from '../context/UserContext';

const AccountMenu = () => {
  const { username } = useUser(); // Get the username from context
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  /**
   * This should invalidate the cookie (ie setting expiration to be in the past)
   */
  const handleLogout = () => {
    document.cookie = "sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/";
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
      </Menu>
    </React.Fragment>
  );
};


const NavigationDrawer = () => {
  const location = useLocation();
  
  const menuItems = [
    { label: 'Home', icon: <HomeIcon />, path: '/home' },
    { label: 'Favorites', icon: <StarIcon />, path: '/favorites' },
    { label: 'Shared With Me', icon: <PeopleIcon />, path: '/shared' },
    { label: 'Trash', icon: <DeleteIcon />, path: '/trash' }
  ];

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: 250,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 250,
          boxSizing: 'border-box',
          backgroundColor: '#f5f8ff',
          padding: '10px',
        },
      }}
    >
      <Box sx={{ padding: '20px 16px', display: 'flex', alignItems: 'center' }}>
        <Box
          component="img"
          src="/owl_icon.png"
          alt="Owl Logo"
          sx={{ width: 32, height: 32, marginRight: 1 }}
        />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Owl Share
        </Typography>
      </Box>

      <List>
        {menuItems.map((item) => (
          <ListItem disablePadding key={item.label}>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                border: '2px solid #b3d1ff',
                borderRadius: '10px',
                padding: '10px 16px',
                marginBottom: '10px',
                '&:hover': {
                  backgroundColor: '#e0f2ff',
                },
                '&.Mui-selected': {
                  backgroundColor: '#dce9ff',
                  borderColor: '#0056b3',
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: 600,
                  color: '#0056b3',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Avatar with logout functionality */}
      <Box sx={{ mt: 'auto', padding: '10px' }}>
        <AccountMenu />
      </Box>
    </Drawer>
  );
};

export default NavigationDrawer;
