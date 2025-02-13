import * as React from 'react';
import { Button, Menu, MenuItem } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

interface FilterProps {
  label: string;
  icon: React.ReactNode;
  options: string[];
  onFilterChange: (label: string, value: string) => void; // Callback for filter changes
}

const Filter: React.FC<FilterProps> = ({
  label,
  icon,
  options,
  onFilterChange,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // for filtering
  const handleMenuItemClick = (option: string) => {
    console.log('menu clicked, option is ', option);
    onFilterChange(label, option); // notify parent of the selected filter
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f0f2f5',
          borderRadius: '50px',
          textTransform: 'none',
          fontWeight: 500,
          color: 'black',
          paddingX: 2,
          paddingY: 1,
          '&:hover': {
            backgroundColor: '#e0e3e7',
          },
        }}
      >
        {icon}
        <span style={{ marginLeft: 8 }}>{label}</span>
        <KeyboardArrowDownIcon sx={{ marginLeft: 1 }} />
      </Button>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {options.map((option, index) => (
          <MenuItem key={index} onClick={() => handleMenuItemClick(option)}>
            {option}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default Filter;
