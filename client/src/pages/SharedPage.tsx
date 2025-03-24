import { useUser } from '../context/UserContext';

import PageComponent from '../components/Page';

const Shared = () => {
  const userContext = useUser();
  return (
    <PageComponent
      page="shared"
      username={userContext?.username || ''}
      userId={userContext?.userId || ''}
    ></PageComponent>
  );
};

export default Shared;
