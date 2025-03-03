import { Dialog, DialogContent } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import TextViewer from './TextViewer';
import { diff_match_patch } from 'diff-match-patch';
import { debounce } from 'lodash';

interface TextEditorProps {
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

interface OperationBatch {
  operations: Operation[];
  batchId: number;
  clientRevision: number;
}

type Operation = InsertOperation | DeleteOperation;

function computeOperationsFromDiff(
  oldContent: string,
  newContent: string,
): Operation[] {
  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(oldContent, newContent);
  dmp.diff_cleanupSemantic(diffs);

  const operations: Operation[] = [];
  let cursor = 0;

  for (const [type, text] of diffs) {
    if (type === -1) {
      // Deletion
      operations.push({
        type: 'delete',
        position: cursor,
        length: text.length,
      });
    } else if (type === 1) {
      // Insertion
      operations.push({
        type: 'insert',
        position: cursor,
        text,
      });
      cursor += text.length;
    } else {
      // Equal - just move the cursor
      cursor += text.length;
    }
  }

  return operations;
}

const TextEditor: React.FC<TextEditorProps> = ({
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
  const [lastBatchId, setLastBatchId] = useState(0);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const batchQueueRef = useRef<OperationBatch[]>([]);
  const currentBatchOperationsRef = useRef<Operation[]>([]);
  const lastAcknowledgedBatchIdRef = useRef(0);
  const localContentRef = useRef('');
  // Add client revision tracking
  const clientRevisionRef = useRef(0);

  const serverUrl = process.env.REACT_APP_API_BASE_URL;
  let wsUrl: string;

  if (!serverUrl) {
    wsUrl = 'ws://localhost:5001';
  } else {
    // Replace http:// or https:// with ws:// or wss:// respectively
    if (serverUrl.startsWith('https://')) {
      wsUrl = 'wss://' + serverUrl.substring(8);
    } else if (serverUrl.startsWith('http://')) {
      wsUrl = 'ws://' + serverUrl.substring(7);
    } else {
      wsUrl = 'ws://' + serverUrl;
    }
  }

  useEffect(() => {
    // Single WebSocket connection
    const ws = new WebSocket(wsUrl);
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
        // Full document update from server
        setContent(message.content);
        localContentRef.current = message.content;
        lastSyncedContentRef.current = message.content;

        // Update client revision
        if (message.revision !== undefined) {
          clientRevisionRef.current = message.revision;
          console.log(
            `Updated client revision to ${clientRevisionRef.current}`,
          );
        }

        // Clear queue when full update
        batchQueueRef.current = [];
        currentBatchOperationsRef.current = [];
        setIsProcessingBatch(false);
      } else if (message.type === 'operation-ack') {
        if (message.batchId) {
          // Update client revision from server if provided
          if (message.revision !== undefined) {
            clientRevisionRef.current = message.revision;
            console.log(
              `Updated client revision to ${clientRevisionRef.current}`,
            );
          }

          if (currentBatchOperationsRef.current.length > 0) {
            // Send next op in the current batch
            const nextOp = currentBatchOperationsRef.current.shift()!;

            if (socketRef.current?.readyState === WebSocket.OPEN) {
              socketRef.current.send(
                JSON.stringify({
                  type: 'update-document',
                  fileId,
                  operation: nextOp,
                  batchId: message.batchId,
                  isLastInBatch: currentBatchOperationsRef.current.length === 0,
                  totalInBatch:
                    batchQueueRef.current[0]?.operations.length || 0,
                  clientRevision: clientRevisionRef.current,
                }),
              );
            }
          } else {
            // batch is complete
            lastAcknowledgedBatchIdRef.current = message.batchId;

            // Remove it
            if (
              batchQueueRef.current.length > 0 &&
              batchQueueRef.current[0].batchId === message.batchId
            ) {
              batchQueueRef.current.shift();
            }

            setIsProcessingBatch(false);
            processBatchQueue();
          }
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  // set up debounced change handler, prevent overloading client
  const debouncedProcessChanges = useRef(
    debounce((newContent: string) => {
      if (!socketRef.current) {
        return;
      }

      const oldContent = localContentRef.current;
      localContentRef.current = newContent;

      if (oldContent === newContent) {
        return; // No changes
      }

      // Get ops
      const operations = computeOperationsFromDiff(oldContent, newContent);
      if (operations.length === 0) {
        return;
      }

      // Create a new batch
      const newBatchId = lastBatchId + 1;
      setLastBatchId(newBatchId);

      const batch: OperationBatch = {
        operations,
        batchId: newBatchId,
        clientRevision: clientRevisionRef.current,
      };

      // Add to queue
      batchQueueRef.current.push(batch);
      processBatchQueue();
    }, 30), // 30ms
  ).current;

  // process the batch queue
  const processBatchQueue = () => {
    if (
      isProcessingBatch ||
      batchQueueRef.current.length === 0 ||
      !socketRef.current ||
      socketRef.current.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    setIsProcessingBatch(true);
    const currentBatch = batchQueueRef.current[0];
    currentBatchOperationsRef.current = [...currentBatch.operations];

    // Send the first operation of the batch
    if (currentBatchOperationsRef.current.length > 0) {
      const firstOp = currentBatchOperationsRef.current.shift()!;

      socketRef.current.send(
        JSON.stringify({
          type: 'update-document',
          fileId,
          operation: firstOp,
          batchId: currentBatch.batchId,
          isLastInBatch: currentBatchOperationsRef.current.length === 0,
          totalInBatch: currentBatch.operations.length,
          clientRevision: currentBatch.clientRevision,
        }),
      );
    } else {
      // somehow we have an empty batch, remove it and process the next one
      batchQueueRef.current.shift();
      setIsProcessingBatch(false);
      processBatchQueue();
    }
  };

  const handleChange = (newContent: string) => {
    // Update UI immediately for responsiveness
    setContent(newContent);

    // Process actual changes with debouncing for stability
    debouncedProcessChanges(newContent);
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
          <TextViewer
            fileType={mimeType}
            content={content}
            onChange={handleChange}
            readOnly={!isConnected}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>
            {isConnected
              ? `Connected (Rev: ${clientRevisionRef.current})`
              : 'Disconnected'}
          </span>
          <button onClick={handleSave} disabled={!isConnected}>
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TextEditor;
