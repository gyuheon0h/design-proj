import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { useUser } from './UserContext';

interface StorageContextType {
  storageUsed: number | null;
  fetchStorageUsed: () => Promise<void>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [storageUsed, setStorageUsed] = useState<number | null>(null);
  const userContext = useUser();
  const userId = userContext.userId;

  const fetchStorageUsed = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/user/${userId}/storage-used`,
        { withCredentials: true },
      );
      const sizeBytes = Number(response.data.totalStorageUsed);
      setStorageUsed(sizeBytes);
    } catch (error) {
      console.error('Error fetching storage:', error);
    }
  }, [userId]);

  return (
    <StorageContext.Provider value={{ storageUsed, fetchStorageUsed }}>
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};
