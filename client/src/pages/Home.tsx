import SearchBar from '../components/SearchBar';
import Folder from '../components/Folder';
import FileContainer from '../components/FileContainer';  
import Divider from '@mui/material/Divider';

const sampleFiles = [
  {
    id: 'file-1',
    name: 'Project Proposal.pdf',
    owner: 'Alice',
    createdAt: new Date('2025-01-25'),
    lastModifiedBy: 'Bob',
    lastModifiedAt: new Date('2025-01-30'),
    parentFolder: null,
    gcsKey: 'key-1',
    fileType: 'pdf',
  },
  {
    id: 'file-2',
    name: 'Data Analysis.csv',
    owner: 'Jake',
    createdAt: new Date('2025-01-20'),
    lastModifiedBy: 'Jake',
    lastModifiedAt: new Date('2025-01-28'),
    parentFolder: null,
    gcsKey: 'key-2',
    fileType: 'csv',
  },
  {
    id: 'file-3',
    name: 'Meeting Notes.txt',
    owner: 'Sophie',
    createdAt: new Date('2025-01-15'),
    lastModifiedBy: 'Ethan',
    lastModifiedAt: new Date('2025-01-29'),
    parentFolder: null,
    gcsKey: 'key-3',
    fileType: 'txt',
  },
  {
    id: 'file-4',
    name: 'Vacation Photo.jpg',
    owner: 'Jake',
    createdAt: new Date('2025-01-10'),
    lastModifiedBy: 'Jake',
    lastModifiedAt: new Date('2025-01-22'),
    parentFolder: null,
    gcsKey: 'key-4',
    fileType: 'photo',
  },
  {
    id: 'file-7',
    name: 'Vacation Photo.jpg',
    owner: 'Jake',
    createdAt: new Date('2025-01-10'),
    lastModifiedBy: 'Jake',
    lastModifiedAt: new Date('2025-01-22'),
    parentFolder: null,
    gcsKey: 'key-4',
    fileType: 'photo',
  },
  {
    id: 'file-5',
    name: 'Vacation Photo.jpg',
    owner: 'Jake',
    createdAt: new Date('2025-01-10'),
    lastModifiedBy: 'Jake',
    lastModifiedAt: new Date('2025-01-22'),
    parentFolder: null,
    gcsKey: 'key-4',
    fileType: 'photo',
  },
];

const Home = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Your File Storage:</h1>
      <SearchBar location="Storage" />

      <h2>Folders</h2>
      <Folder
        id="id"
        name="Folder"
        owner="Jake"
        createdAt={new Date('2025-01-31')}
        parentFolder={null}
        folderChildren={[]}
        fileChildren={[]}
      />

      <Divider style={{ padding: '20px' }} />

      {/* <h2>Files</h2> */} 
      {/* can change later, but i commented out the above so i can put Files in file Container so 
      upload button is on the same line. */}
      <FileContainer files={sampleFiles} />  
    </div>
  );
};

export default Home;
