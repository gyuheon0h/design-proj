import { Dialog, DialogContent } from '@mui/material';
import { useState, useEffect, useRef } from 'react';

import CodeOrTextEditor from './TextViewEditor';

interface FileEditorProps {
  open: boolean;
  fileId: string;
  gcsKey: string;
  mimeType: string;
  onClose: () => void;
}

const FileEditor: React.FC<FileEditorProps> = ({
  open,
  fileId,
  gcsKey,
  mimeType,
  onClose,
}) => {
  const [content, setContent] = useState('');

  useEffect(() => {
    // ✅ Only create WebSocket inside useEffect
    const socket = new WebSocket('ws://localhost:5001');

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: 'join-document',
          fileId,
          gcsKey,
        }),
      );
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'document-update') {
        setContent(message.content);
      }
    };

    // Cleanup when component unmounts
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'leave-document', fileId }));
      }
      socket.close();
    };
  }, [fileId, gcsKey]);

  // Because the socket is now local to `useEffect`, we need a way to send ops
  // from event handlers. FUCK

  // keep the socket in a ref
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5001');
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join-document', fileId, gcsKey }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'document-update') {
        setContent(message.content);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'leave-document', fileId }));
      }
      ws.close();
    };
  }, [fileId, gcsKey]);

  // Then your handlers can do:
  const handleChange = (newContent: string) => {
    const operation = {
      type: newContent.length > content.length ? 'insert' : 'delete',
      position:
        newContent.length > content.length
          ? content.length
          : content.length - 1,
      char:
        newContent.length > content.length ? newContent[content.length] : null,
    };

    setContent(newContent);

    // Use the ref for sending
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({ type: 'update-document', fileId, operation }),
      );
    }
  };

  const handleSave = () => {
    console.log('save clicked');
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log('save sent');
      socketRef.current.send(
        JSON.stringify({
          type: 'save-document',
          fileId,
          mimeType,
          gcsKey,
        }),
      );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          position: 'relative',
          height: '80vh',
        }}
      >
        <CodeOrTextEditor
          fileType={mimeType}
          content={content}
          onChange={handleChange}
          readOnly={false}
        />
        <button onClick={handleSave}>Save</button>
      </DialogContent>
    </Dialog>
  );
};

export default FileEditor;
