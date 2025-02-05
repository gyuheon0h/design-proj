import Folder from '../components/Folder';
import Divider from '@mui/material/Divider';
import SearchBar from '../components/SearchBar';
import FileContainer from '../components/FileContainer';
import FolderContainer from '../components/FolderContainer';
import { FolderProp } from '../components/Folder';

const Home = () => {
  const folders: FolderProp[] = [
    {
      id: 'a',
      name: 'Folder 1',
      owner: 'Jake',
      createdAt: new Date('2025-01-31'),
      parentFolder: null,
      folderChildren: [],
      fileChildren: [],
    },
    {
      id: 'b',
      name: 'Folder 2',
      owner: 'Jake',
      createdAt: new Date('2025-01-31'),
      parentFolder: null,
      folderChildren: [],
      fileChildren: [],
    },
    {
      id: 'c',
      name: 'Folder 3',
      owner: 'Jake',
      createdAt: new Date('2025-01-31'),
      parentFolder: null,
      folderChildren: [],
      fileChildren: [],
    },
    {
      id: 'd',
      name: 'Folder 4',
      owner: 'Jake',
      createdAt: new Date('2025-01-31'),
      parentFolder: null,
      folderChildren: [],
      fileChildren: [],
    },
    {
      id: 'e',
      name: 'Folder 5',
      owner: 'Jake',
      createdAt: new Date('2025-01-31'),
      parentFolder: null,
      folderChildren: [],
      fileChildren: [],
    },
    {
      id: 'f',
      name: 'Folder 6',
      owner: 'Jake',
      createdAt: new Date('2025-01-31'),
      parentFolder: null,
      folderChildren: [],
      fileChildren: [],
    },
    {
      id: 'g',
      name: 'Folder 7',
      owner: 'Jake',
      createdAt: new Date('2025-01-31'),
      parentFolder: null,
      folderChildren: [],
      fileChildren: [],
    },
    {
      id: 'h',
      name: 'Folder 8',
      owner: 'Jake',
      createdAt: new Date('2025-01-31'),
      parentFolder: null,
      folderChildren: [],
      fileChildren: [],
    },
    {
      id: 'i',
      name: 'Folder 9',
      owner: 'Jake',
      createdAt: new Date('2025-01-31'),
      parentFolder: null,
      folderChildren: [],
      fileChildren: [],
    },
    {
      id: 'j',
      name: 'Folder 10',
      owner: 'Jake',
      createdAt: new Date('2025-01-31'),
      parentFolder: null,
      folderChildren: [],
      fileChildren: [],
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1>Your File Storage:</h1>
      <SearchBar location="Storage" />
      <h2>Folders</h2>
      <FolderContainer initialFolders={folders} itemsPerPage={5} />;
      {/* <FileContainer></FileContainer> */}
      <Divider style={{ padding: '20px' }}></Divider>
      <h2>Files</h2>
      {/* <FolderContainer></FolderContainer> */}
    </div>
  );
};

export default Home;
