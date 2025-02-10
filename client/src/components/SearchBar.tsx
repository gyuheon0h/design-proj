import React, { useState } from 'react';
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
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ location, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchTerm(query);
    onSearch(query); // Pass the search query to parent components
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        mt: 2,
      }}
    >
      {/* Search Bar */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder={`Search in ${location}`}
        value={searchTerm}
        onChange={handleSearchChange}
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
          label="Type"
          icon={<InsertDriveFileIcon />}
          options={['.txt', '.png', '.jpeg']}
        />
        <Filter
          label="Modified"
          icon={<EventIcon />}
          options={['Today', 'Last week', 'Last month']}
        />
        <Filter
          label="Created"
          icon={<EventIcon />}
          options={['Today', 'Last week', 'Last month']}
        />
      </Box>
    </Box>
  );
};

export default SearchBar;
