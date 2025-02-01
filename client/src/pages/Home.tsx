import Folder from '../components/Folder';

const Home = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>File Cloud Storage - Home</h1>
      <p>COMP 413</p>
      <Folder
        id="id"
        name="Folder"
        owner="Jake"
        createdAt={new Date('2025-01-31')}
        parentFolder={null}
        folderChildren={[]}
        fileChildren={[]}
      />
    </div>
  );
};

export default Home;
