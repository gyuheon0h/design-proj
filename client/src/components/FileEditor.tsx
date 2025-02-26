import { Dialog, DialogContent } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import CodeOrTextEditor from './TextViewEditor';
import { debounce } from 'lodash';

interface FileEditorProps {
  open: boolean;
  fileId: string;
  gcsKey: string;
  mimeType: string;
  onClose: () => void;
}

interface InsertOperation {
  type: 'insert';
  position: number;
  text: string;
}

interface DeleteOperation {
  type: 'delete';
  position: number;
  length: number;
}

type Operation = InsertOperation | DeleteOperation;

const FileEditor: React.FC<FileEditorProps> = ({
  open,
  fileId,
  gcsKey,
  mimeType,
  onClose,
}) => {
  const [content, setContent] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const lastSyncedContentRef = useRef('');
  const pendingOpsRef = useRef<Operation[]>([]);
  const contentBufferRef = useRef(content);
  const [isProcessingOp, setIsProcessingOp] = useState(false);
  const operationQueueRef = useRef<Operation[]>([]);

  useEffect(() => {
    // Single WebSocket connection
    const ws = new WebSocket('ws://localhost:5001');
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      ws.send(
        JSON.stringify({
          type: 'join-document',
          fileId,
          gcsKey,
        }),
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'document-update') {
        setContent(message.content);
        lastSyncedContentRef.current = message.content;
        pendingOpsRef.current = [];
      } else if (message.type === 'operation-ack') {
        if (pendingOpsRef.current.length > 0) {
          pendingOpsRef.current.shift();
        }
        setIsProcessingOp(false);
        // Process next operation in queue
        setTimeout(processOperationQueue, 0);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'leave-document', fileId }));
      }
      ws.close();
    };
  }, [fileId]);

  const debouncedProcessChange = useRef(
    debounce((newContent: string) => {
      if (!isConnected) {
        setContent(newContent);
        return;
      }

      const oldContent = content;
      setContent(newContent);

      // diff detection
      const operation = computeOperation(oldContent, newContent);

      // Add to operation queue
      operationQueueRef.current.push(operation);

      // Try to process the queue
      if (!isProcessingOp) {
        processOperationQueue();
      }
    }, 50), // Small delay for a bunch fo changes as once
  ).current;

  // Function to process the operation queue
  const processOperationQueue = () => {
    if (
      isProcessingOp ||
      operationQueueRef.current.length === 0 ||
      !socketRef.current ||
      socketRef.current.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    setIsProcessingOp(true);
    const operation = operationQueueRef.current.shift()!;
    pendingOpsRef.current.push(operation);

    socketRef.current.send(
      JSON.stringify({
        type: 'update-document',
        fileId,
        operation,
        revision: pendingOpsRef.current.length,
      }),
    );
  };

  // diff detection function
  function computeOperation(oldContent: string, newContent: string): Operation {
    // Find the common prefix length
    let prefixLength = 0;
    const minLength = Math.min(oldContent.length, newContent.length);

    while (
      prefixLength < minLength &&
      oldContent[prefixLength] === newContent[prefixLength]
    ) {
      prefixLength++;
    }

    // Find the common suffix length (starting from the end of the strings)
    let oldSuffixLength = oldContent.length - prefixLength;
    let newSuffixLength = newContent.length - prefixLength;
    let suffixLength = 0;

    while (
      suffixLength < oldSuffixLength &&
      suffixLength < newSuffixLength &&
      oldContent[oldContent.length - suffixLength - 1] ===
        newContent[newContent.length - suffixLength - 1]
    ) {
      suffixLength++;
    }

    // Adjusted lengths considering both prefix and suffix
    const deleteLength = oldContent.length - prefixLength - suffixLength;
    const insertText = newContent.substring(
      prefixLength,
      newContent.length - suffixLength,
    );

    // appropriate operations fuck this is so hard
    if (deleteLength > 0 && insertText.length > 0) {
      // This is a replace operation, which we'll implement as delete followed by insert
      // For simplicity, we'll return just the first operation and queue the second one
      const deleteOp: DeleteOperation = {
        type: 'delete',
        position: prefixLength,
        length: deleteLength,
      };

      const insertOp: InsertOperation = {
        type: 'insert',
        position: prefixLength,
        text: insertText,
      };

      // Store the insert operation to be sent after the delete is acknowledged
      pendingOpsRef.current.push(insertOp);
      return deleteOp;
    } else if (deleteLength > 0) {
      // This is a simple delete operation
      return {
        type: 'delete',
        position: prefixLength,
        length: deleteLength,
      };
    } else {
      // This is a simple insert operation
      return {
        type: 'insert',
        position: prefixLength,
        text: insertText,
      };
    }
  }

  const handleChange = (newContent: string) => {
    // Update the content immediately for local display
    setContent(newContent);

    // Store in buffer for debounced processing
    contentBufferRef.current = newContent;

    // Process the change with debouncing
    debouncedProcessChange(newContent);
  };

  const handleSave = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
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
        <div style={{ flexGrow: 1 }}>
          <CodeOrTextEditor
            fileType={mimeType}
            content={content}
            onChange={handleChange}
            readOnly={!isConnected}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          <button onClick={handleSave} disabled={!isConnected}>
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileEditor;
