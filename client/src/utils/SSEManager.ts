type ProgressHandler = (data: { percent: number }) => void;
type StatusHandler = () => void;
type ErrorHandler = () => void;

interface Listener {
  fileId: string;
  onProgress: ProgressHandler;
  onDone: StatusHandler;
  onError: ErrorHandler;
}

const listeners: Listener[] = [];
let source: EventSource | null = null;

export const SSEManager = {
  init(userId: string) {
    if (source) return;

    source = new EventSource(
      `${process.env.REACT_APP_API_BASE_URL}/api/file/events/${userId}`,
    );

    source.addEventListener('progress', (e) => {
      const { fileId, percent } = JSON.parse(e.data);
      listeners.forEach((l) => {
        if (l.fileId === fileId) l.onProgress({ percent });
      });
    });

    source.addEventListener('status', (e) => {
      const { fileId, message } = JSON.parse(e.data);
      if (!message.includes('Saving')) return;
      listeners.forEach((l) => {
        if (l.fileId === fileId) l.onDone();
      });
    });

    source.addEventListener('done', (e) => {
      const { fileId } = JSON.parse(e.data);
      listeners.forEach((l) => {
        if (l.fileId === fileId) l.onDone();
      });
    });

    source.onerror = () => {
      listeners.forEach((l) => l.onError());
      source?.close();
      source = null;
    };
  },

  subscribe(listener: Listener) {
    listeners.push(listener);
  },

  unsubscribe(fileId: string) {
    const index = listeners.findIndex((l) => l.fileId === fileId);
    if (index !== -1) listeners.splice(index, 1);
  },
};
