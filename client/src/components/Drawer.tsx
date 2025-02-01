import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
  Typography,
  Box,
} from '@mui/material';
import { Link } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';

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
      {/* Logo  */}
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
            <ListItemIcon>
              <HomeIcon sx={{ color: '#0056b3' }} />
            </ListItemIcon>
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
            <ListItemIcon>
              <PeopleIcon sx={{ color: '#0056b3' }} />
            </ListItemIcon>
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
    </Drawer>
  );
};

export default NavigationDrawer;
