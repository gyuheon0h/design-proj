import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import { Link } from 'react-router-dom';

const NavigationDrawer = () => {
  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: 250,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: 250, boxSizing: 'border-box' },
      }}
    >
      <List>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/home">
            <ListItemText primary="Home" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/shared">
            <ListItemText primary="Shared" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default NavigationDrawer;
