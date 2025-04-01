import React, { useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { useUser } from '../context/UserContext';
import axios from 'axios';
import { useStorage } from '../context/StorageContext';

interface StorageData {
  totalStorageUsed: number;
}

const STORAGE_LIMIT = 15 * 1024 * 1024 * 1024; // 15GB in bytes

const StorageAnalytics = () => {
  const userContext = useUser();
  const userId = userContext.userId;

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
  console.log('normalizedStorageUsed', normalizedStorageUsed);
  console.log('storageUsedGB', storageUsedGB);

  console.log('storageUsed:', normalizedStorageUsed); // for debugging

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>☁️ My Storage</span>
      </div>
      <div style={styles.progressBarContainer}>
        <div
          style={{
            ...styles.progressBar,
            width: `${percentageUsed}%`,
          }}
        ></div>
      </div>
      <p style={styles.text}>You have used {storageUsedGB} GB out of 15 GB.</p>
    </div>
  );
};

const styles = {
  container: {
    background: '#1e1e1e',
    color: '#fff',
    padding: '16px',
    borderRadius: '8px',
    width: '250px',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'center' as const,
  },
  header: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  progressBarContainer: {
    background: '#333',
    borderRadius: '8px',
    width: '100%',
    height: '8px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    background: '#6a5acd',
    transition: 'width 0.5s ease-in-out',
  },
  text: {
    marginTop: '8px',
    fontSize: '12px',
  },
};

export default StorageAnalytics;
