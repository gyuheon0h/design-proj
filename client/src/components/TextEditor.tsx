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
        // Full document update from server
        setContent(message.content);
        localContentRef.current = message.content;
        lastSyncedContentRef.current = message.content;

        // Clear all queues when getting a full update
        batchQueueRef.current = [];
        currentBatchOperationsRef.current = [];
        setIsProcessingBatch(false);
      } else if (message.type === 'operation-ack') {
        if (message.batchId) {
          // Handle batch acknowledgment
          if (currentBatchOperationsRef.current.length > 0) {
            // Send the next operation in the current batch
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
                }),
              );
            }
          } else {
            // This batch is complete
            lastAcknowledgedBatchIdRef.current = message.batchId;

            // Remove the completed batch
            if (
              batchQueueRef.current.length > 0 &&
              batchQueueRef.current[0].batchId === message.batchId
            ) {
              batchQueueRef.current.shift();
            }

            // Reset processing flag
            setIsProcessingBatch(false);

            // Process next batch if available
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

      // Get operations
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
      };

      // Add to queue
      batchQueueRef.current.push(batch);

      // Try to process the queue
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
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          <button onClick={handleSave} disabled={!isConnected}>
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TextEditor;
