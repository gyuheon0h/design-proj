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
import { Link, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import DeleteIcon from '@mui/icons-material/Delete';
import { colors, drawerStyles, activePageStyles} from '../Styles';

const NavigationDrawer = () => {
  const location = useLocation();

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
        <Typography
          variant="h1"
          sx={{ fontWeight: 700, fontFamily: '"Kurale", serif', color: colors.darkBlue }}
        >
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
            <ListItemText primary="Home" />
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
            <ListItemText primary="Favorites" />
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
            <ListItemText primary="Shared With Me" />
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
            <ListItemText primary="Trash" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default NavigationDrawer;
