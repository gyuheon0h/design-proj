import { useUser } from '../context/UserContext';
import PageComponent from '../components/Page';

const Home = () => {
  const userContext = useUser();

  return (
    <PageComponent
      page="home"
      username={userContext?.username || ''}
      userId={userContext?.userId || ''}
    ></PageComponent>
  );
};

export default Home;
