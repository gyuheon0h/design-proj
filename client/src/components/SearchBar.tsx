import React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import EventIcon from '@mui/icons-material/Event';
import Filter from './Filter';
import { colors } from '../Styles';

interface SearchBarProps {
  location: string;
  setFileTypeFilter: (value: string) => void;
  setCreatedAtFilter: (value: string) => void;
  setModifiedAtFilter: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  location,
  setFileTypeFilter,
  setCreatedAtFilter,
  setModifiedAtFilter,
}) => {
  // handle filtering
  const handleFilterChange = (label: string, value: string) => {
    if (label === 'Type') setFileTypeFilter(value);
    if (label === 'Created') setCreatedAtFilter(value);
    if (label === 'Modified') setModifiedAtFilter(value);
  };
  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      }}
    >
      {/* Search Bar */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder={`Search in ${location}`}
        sx={{
          maxWidth: 680,
          backgroundColor: '#f0f2f5',
          borderRadius: '50px',
          '& .MuiOutlinedInput-root': {
            borderRadius: '50px',
            paddingLeft: 1,
          },
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
          '& .MuiInputBase-input::placeholder': {
            color: colors.darkGrey,
            opacity: 1,
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: colors.darkGrey }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Filters Section */}
      <Box sx={{ display: 'flex', gap: '10px' }}>
        <Filter
          label={'Type'}
          icon={<InsertDriveFileIcon />}
          options={['.txt', '.png', '.jpeg']}
          onFilterChange={handleFilterChange}
        />
        <Filter
          label={'Modified'}
          icon={<EventIcon />}
          options={['Today', 'Last week', 'Last month']}
          onFilterChange={handleFilterChange}
        />
        <Filter
          label={'Created'}
          icon={<EventIcon />}
          options={['Today', 'Last week', 'Last month']}
          onFilterChange={handleFilterChange}
        />
      </Box>
    </Box>
  );
};

export default SearchBar;
