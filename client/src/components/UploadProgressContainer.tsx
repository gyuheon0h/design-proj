import React from 'react';
import UploadProgressToast from './UploadProgress';

interface UploadFileEntry {
  id: string;
  file: File;
}

interface UploadToastContainerProps {
  uploads: UploadFileEntry[];
  userId: string;
  parentFolder: string | null;
  refreshFiles: (folderId: string | null) => void; // low key need to move this out
  refreshStorage: () => Promise<void>; // move this out
  removeUpload: (id: string) => void;
}

const UploadToastContainer: React.FC<UploadToastContainerProps> = ({
  uploads,
  userId,
  parentFolder,
  refreshFiles,
  refreshStorage,
  removeUpload,
}) => {
  return (
    <>
      {uploads.map((upload, index) => (
        <UploadProgressToast
          key={upload.id}
          file={upload.file}
          userId={userId}
          fileId={upload.id}
          parentFolder={parentFolder}
          refreshFiles={refreshFiles}
          refreshStorage={refreshStorage}
          onClose={() => removeUpload(upload.id)}
          offset={index * 80}
        />
      ))}
    </>
  );
};

export default UploadToastContainer;
