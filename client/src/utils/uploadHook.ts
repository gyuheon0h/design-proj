// useSSEUploadProgress.ts
import { useState } from 'react';

export function useSSEUploadProgress() {
  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [done, setDone] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const startListening = (userId: string) => {
    if (eventSource) return; // prevent duplicate connections

    const baseURL = process.env.REACT_APP_API_BASE_URL;
    const source = new EventSource(`${baseURL}/api/file/events/${userId}`);
    setEventSource(source);

    source.addEventListener('progress', (event) => {
      const { percent } = JSON.parse(event.data);
      setProgress(percent);
    });

    source.addEventListener('status', (event) => {
      const { message } = JSON.parse(event.data);
      setStatus(message);
    });

    source.addEventListener('done', (event) => {
      setDone(true);
      source.close();
    });

    source.addEventListener('error', () => {
      setError('An error occurred during upload.');
      source.close();
    });
  };

  const stopListening = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
  };

  return {
    progress,
    status,
    done,
    error,
    startListening,
    stopListening,
  };
}
