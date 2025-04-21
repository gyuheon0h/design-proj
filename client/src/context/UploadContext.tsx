import React, { createContext, useContext, useState } from 'react';

interface UploadFileEntry {
  id: string;
  file: File;
  relativePath: string;
  parentFolder: string | null; // new
}

// interface UploadContextType {
//   uploadsInProgress: UploadFileEntry[];


//   refreshFiles: (folderId: string | null) => void;
//   refreshStorage: () => Promise<void>;
//   currentFolderId: string | null;
  
// }

interface UploadContextType {
  uploads: UploadFileEntry[];
  addUploads: (uploads: UploadFileEntry[]) => void;
  removeUpload: (id: string) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);


export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uploads, setUploads] = useState<UploadFileEntry[]>([]);

  const addUploads = (newUploads: UploadFileEntry[]) => {
    setUploads((prev) => [...prev, ...newUploads]);
  };

  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <UploadContext.Provider value={{ uploads, addUploads, removeUpload }}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) throw new Error('UploadContext not available');
  return context;
};
