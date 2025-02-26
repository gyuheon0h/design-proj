import { useUser } from '../context/UserContext';
import PageComponent from '../components/Page';

const Favorites = () => {
  const userContext = useUser();
  return (
    <PageComponent
      page="favorites"
      username={userContext?.username || ''}
      userId={userContext?.userId || ''}
    ></PageComponent>
  );
};

export default Favorites;
