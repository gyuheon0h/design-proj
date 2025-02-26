import { useUser } from '../context/UserContext';
import PageComponent from '../components/Page';
import ErrorAlert from '../components/ErrorAlert';
import { useState } from 'react';

const Trash = () => {
  const userContext = useUser();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <PageComponent
        page="trash"
        username={userContext?.username || ''}
        userId={userContext?.userId || ''}
      ></PageComponent>
      {error && (
        <ErrorAlert
          open={!!error}
          message={error}
          onClose={() => setError(null)}
        />
      )}
    </div>
  );
};

export default Trash;
