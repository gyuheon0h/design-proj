import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import EventIcon from '@mui/icons-material/Event';
import Filter from './Filter';
import { colors } from '../Styles';
import Typography from '@mui/material/Typography';

interface SearchBarProps {
  location: string;
  onSearch: (query: string) => void;
  setFileTypeFilter: (value: string) => void;
  setCreatedAtFilter: (value: string) => void;
  setModifiedAtFilter: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  location,
  onSearch,
  setFileTypeFilter,
  setCreatedAtFilter,
  setModifiedAtFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce state update to avoid triggering re-renders immediately
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSearch(searchTerm); // Now updates only after the user stops typing
    }, 300); // debounce time

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, onSearch]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchTerm(query);
    // onSearch(query); // Pass the search query to parent components
  };

  // State to track selected filter values
  const [selectedFilters, setSelectedFilters] = useState({
    fileType: '',
    createdAt: '',
    modifiedAt: '',
  });

  // handle filtering
  const handleFilterChange = (label: string, value: string) => {
    setSelectedFilters((prev) => {
      const updatedFilters = { ...prev };

      if (label === 'Type') {
        setFileTypeFilter(value === 'Reset' ? '' : value);
        updatedFilters.fileType = value === 'Reset' ? '' : value;
      }
      if (label === 'Created') {
        setCreatedAtFilter(value === 'Reset' ? '' : value);
        updatedFilters.createdAt = value === 'Reset' ? '' : value;
      }
      if (label === 'Modified') {
        setModifiedAtFilter(value === 'Reset' ? '' : value);
        updatedFilters.modifiedAt = value === 'Reset' ? '' : value;
      }

      return updatedFilters;
    });
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
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Filter
            label="Type"
            icon={<InsertDriveFileIcon />}
            options={['.txt', '.png', '.jpeg', '.pdf', 'Reset']}
            onFilterChange={handleFilterChange}
          />
          {selectedFilters.fileType && (
            <Typography
              variant="body2"
              sx={{ color: colors.darkGrey, marginTop: '4px' }}
            >
              {selectedFilters.fileType}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Filter
            label="Modified"
            icon={<EventIcon />}
            options={['Today', 'Last week', 'Last month', 'Reset']}
            onFilterChange={handleFilterChange}
          />
          {selectedFilters.modifiedAt && (
            <Typography
              variant="body2"
              sx={{ color: colors.darkGrey, marginTop: '4px' }}
            >
              {selectedFilters.modifiedAt}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Filter
            label="Created"
            icon={<EventIcon />}
            options={['Today', 'Last week', 'Last month', 'Reset']}
            onFilterChange={handleFilterChange}
          />
          {selectedFilters.createdAt && (
            <Typography
              variant="body2"
              sx={{ color: colors.darkGrey, marginTop: '4px' }}
            >
              {selectedFilters.createdAt}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default SearchBar;
