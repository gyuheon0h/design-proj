import React from 'react';
import FileComponent from './File';

interface File {
  id: string;
  name: string;
  owner: string;
  createdAt: Date;
  lastModifiedBy: string | null;
  lastModifiedAt: Date;
  parentFolder: string | null;
  gcsKey: string;
  fileType: string;
}

interface FileContainerProps {
  files: File[];
}

const FileContainer: React.FC<FileContainerProps> = ({ files }) => {
  return (
    <div style={{ padding: '20px' }}>
      {files.map((file) => (
        <FileComponent
          key={file.id}
          id={file.id}
          name={file.name}
          owner={file.owner}
          createdAt={file.createdAt}
          lastModifiedBy={file.lastModifiedBy}
          lastModifiedAt={file.lastModifiedAt}
          parentFolder={file.parentFolder}
          gcsKey={file.gcsKey}
          fileType={file.fileType}
        />
      ))}
    </div>
  );
};

export default FileContainer;
