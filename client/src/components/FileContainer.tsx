import React, { useState } from 'react';
import { Button } from '@mui/material';
import FileComponent from './File';
import UploadDialog from '../pages/CreateFileDialog';
import { colors, typography } from '../Styles';
import axios from 'axios';

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
  currentFolderId: string | null;
}

const FileContainer: React.FC<FileContainerProps> = ({
  files,
  currentFolderId,
}) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleUploadFile = async (file: Blob, fileName: string) => {
    const formData = new FormData();
    console.log(file, fileName, currentFolderId);
    formData.append('file', file);
    formData.append('fileName', fileName);
    if (currentFolderId) {
      formData.append('parentFolder', currentFolderId);
    }
    try {
      for (let pair of formData.entries()) {
        console.log(pair);
      }
      const response = await axios.post(
        'http://localhost:5001/api/file/upload',
        formData,
        {
          withCredentials: true,
        },
      );
      return response.data;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  return (
    <div>
      {/* Header section with title and upload button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '15px',
        }}
      >
        {/* <Typography
          variant="h4"
          sx={{
            fontFamily: typography.fontFamily,
            fontSize: typography.fontSize.large,
            fontWeight: 'bold',
          }}
        >
          Files
        </Typography> */}
        {/* fix alignment for the above */}
        <h2>Files</h2>

        <Button
          variant="contained"
          onClick={handleOpen}
          sx={{
            backgroundColor: colors.lightBlue,
            color: colors.darkBlue,
            fontFamily: typography.fontFamily,
            fontSize: typography.fontSize.medium,
            fontWeight: 'bold',
            marginLeft: '15px',
            '&:hover': {
              backgroundColor: colors.darkBlue,
              color: colors.white,
            },
          }}
        >
          + Create
        </Button>
      </div>

      {/* File List */}
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

      {/* Dialog */}
      <UploadDialog
        open={open}
        onClose={handleClose}
        onFileUpload={handleUploadFile}
      />
    </div>
  );
};

export default FileContainer;
