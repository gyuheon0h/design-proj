import React, { useState } from 'react';
import { Button } from '@mui/material';
import FileComponent from './File';
import UploadDialog from '../pages/UploadDialog'; 
import { colors, typography } from '../Styles'; 

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
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleFileUpload = (fileName: string) => {
    console.log(`New file created: ${fileName}`);
    // handle file creation here!
    // smth like
    // const new file: File = {
      // id: 
      // name: 
      // ...
    // }
    // const [fileList, setFileList] = useState<File[]>(files); somewhere above
    // setFileList()
    // handleClose()

  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Header section with title and upload button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
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
            }
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
      <UploadDialog open={open} onClose={handleClose} onFileUpload={handleFileUpload} />
    </div>
  );
};

export default FileContainer;
