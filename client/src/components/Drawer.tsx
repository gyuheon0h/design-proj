import * as React from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import LogoutIcon from '@mui/icons-material/ExitToApp';
import { Drawer, List, ListItem, ListItemText, ListItemButton, ListItemIcon as DrawerListItemIcon, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';

const AccountMenu = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
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
          <Avatar sx={{ width: 32, height: 32 }}>M</Avatar>
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
        <MenuItem onClick={handleClose} sx={{ color: 'red' }}>
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
        {/* Home */}
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/home"
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
            <DrawerListItemIcon>
              <HomeIcon sx={{ color: '#0056b3' }} />
            </DrawerListItemIcon>
            <ListItemText
              primary="Home"
              primaryTypographyProps={{
                fontWeight: 600,
                color: '#0056b3',
              }}
            />
          </ListItemButton>
        </ListItem>

        {/* Shared With Me */}
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/shared"
            sx={{
              border: '2px solid #b3d1ff',
              borderRadius: '12px',
              padding: '10px 16px',
              '&:hover': {
                backgroundColor: '#e0f2ff',
              },
              '&.Mui-selected': {
                backgroundColor: '#dce9ff',
                borderColor: '#0056b3',
              },
            }}
          >
            <DrawerListItemIcon>
              <PeopleIcon sx={{ color: '#0056b3' }} />
            </DrawerListItemIcon>
            <ListItemText
              primary="Shared With Me"
              primaryTypographyProps={{
                fontWeight: 600,
                color: '#0056b3',
              }}
            />
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
