import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import SearchBar from '../components/SearchBar';
import { typography } from '../Styles';

interface HeaderProps {
  title: string;
  location: string;
  folderPath: string[];
  folderNames: { [key: string]: string };
  handleBreadcrumbClick: (index: number) => void;
  handleSearch: (query: string) => void;
  setFileTypeFilter: React.Dispatch<React.SetStateAction<string | null>>;
  setCreatedAtFilter: React.Dispatch<React.SetStateAction<string | null>>;
  setModifiedAtFilter: React.Dispatch<React.SetStateAction<string | null>>;
}

const Header: React.FC<HeaderProps> = ({
  title,
  location,
  folderPath,
  folderNames,
  handleBreadcrumbClick,
  handleSearch,
  setFileTypeFilter,
  setCreatedAtFilter,
  setModifiedAtFilter,
}) => {
  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        left: 0,
        backgroundColor: 'white',
        zIndex: 1000,
        padding: '15px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <Typography
        variant="h1"
        sx={{
          fontWeight: 'bold',
          fontFamily: typography.fontFamily,
          fontSize: typography.fontSize.extraLarge,
          color: '#161C94',
          marginLeft: '10px',
          paddingTop: '25px',
          paddingBottom: '15px',
        }}
      >
        {title}
      </Typography>

      <Box sx={{ marginLeft: '10px' }}>
        <SearchBar
          location={location}
          onSearch={handleSearch}
          setFileTypeFilter={setFileTypeFilter}
          setCreatedAtFilter={setCreatedAtFilter}
          setModifiedAtFilter={setModifiedAtFilter}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
        }}
      >
        {[location, ...folderPath].map((crumb, index) => (
          <span
            key={index}
            onClick={() => handleBreadcrumbClick(index - 1)}
            style={{
              cursor: 'pointer',
              color: '#161C94',
              fontWeight: 'bold',
              marginLeft: '10px',
              paddingTop: '10px',
            }}
          >
            {index === 0 ? location : folderNames[crumb] || ''}
            {index < folderPath.length ? ' / ' : ''}
          </span>
        ))}
      </Box>
    </Box>
  );
};

export default Header;
