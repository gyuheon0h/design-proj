import { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';
import { colors } from '../Styles';
import { useStorage } from '../context/StorageContext';

const STORAGE_LIMIT = 15 * 1024 * 1024 * 1024; // 15GB in bytes

export const StorageAnalytics = () => {
  const { storageUsed, fetchStorageUsed } = useStorage();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchStorageUsed();
      setLoading(false);
    };
    load();
  }, [fetchStorageUsed]);

  if (loading) {
    return <CircularProgress size={24} />;
  }

  if (storageUsed === null) {
    return <p>Error loading storage data.</p>;
  }

  const normalizedStorageUsed = Number(storageUsed); // make sure it's a clean number
  const percentageUsed = (normalizedStorageUsed / STORAGE_LIMIT) * 100;
  const storageUsedGB = (normalizedStorageUsed / 1024 / 1024 / 1024).toFixed(2);

  return (
    <Box sx={{ mt: 'auto', padding: '16px' }}>
      <Box
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '16px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <CloudIcon sx={{ color: colors.sidebarText, mr: 1, fontSize: 20 }} />
          <Typography
            variant="body2"
            sx={{ color: colors.sidebarText, fontWeight: 500 }}
          >
            My Storage
          </Typography>
        </Box>

        <Box
          sx={{
            width: '100%',
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 5,
            height: 4,
            mb: 1,
          }}
        >
          <Box
            sx={{
              width: `${percentageUsed}%`,
              bgcolor: '#3B82F6',
              borderRadius: 5,
              height: '100%',
            }}
          />
        </Box>

        <Typography
          variant="caption"
          sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
        >
          You have used {storageUsedGB} GB out of {15} GB.
        </Typography>
      </Box>
    </Box>
  );
};

export default StorageAnalytics;
