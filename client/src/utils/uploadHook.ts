import { useEffect, useState } from 'react';
import { SSEManager } from './SSEManager';

export const useSSEUploadProgress = (fileId: string, userId: string) => {
  const [progress, setProgress] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    SSEManager.init(userId);

    SSEManager.subscribe({
      fileId,
      onProgress: ({ percent }) => {
        setProgress(percent);
      },
      onDone: () => {
        setTimeout(() => {
          setDone(true);
        }, 400);
      },
      onError: () => {
        setError(true);
      },
    });

    return () => {
      SSEManager.unsubscribe(fileId);
    };
  }, [fileId, userId]);

  return { progress, done, error };
};
