import { useUser } from '../context/UserContext';
import PageComponent from '../components/Page';

const Trash = () => {
  const userContext = useUser();

  return (
    <PageComponent
      page="trash"
      username={userContext?.username || ''}
      userId={userContext?.userId || ''}
    ></PageComponent>
  );
};

export default Trash;
