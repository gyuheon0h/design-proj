// import { Box, Chip, Dialog, DialogContent, Typography } from '@mui/material';
// import { useState, useEffect, useRef } from 'react';
// import TextViewer from './TextViewer';
// import { diff_match_patch } from 'diff-match-patch';
// import { debounce } from 'lodash';
// import { useUser } from '../context/UserContext';
// import { getUsernameById } from '../utils/helperRequests';

// interface TextEditorProps {
//   open: boolean;
//   fileId: string;
//   gcsKey: string;
//   mimeType: string;
//   onClose: () => void;
// }

// interface InsertOperation {
//   type: 'insert';
//   position: number;
//   text: string;
// }

// interface DeleteOperation {
//   type: 'delete';
//   position: number;
//   length: number;
// }

// interface OperationBatch {
//   operations: Operation[];
//   batchId: number;
//   clientRevision: number;
// }

// type Operation = InsertOperation | DeleteOperation;

// function computeOperationsFromDiff(
//   oldContent: string,
//   newContent: string,
// ): Operation[] {
//   const dmp = new diff_match_patch();
//   const diffs = dmp.diff_main(oldContent, newContent);
//   dmp.diff_cleanupSemantic(diffs);

//   const operations: Operation[] = [];
//   let cursor = 0;

//   for (const [type, text] of diffs) {
//     if (type === -1) {
//       // Deletion
//       operations.push({
//         type: 'delete',
//         position: cursor,
//         length: text.length,
//       });
//     } else if (type === 1) {
//       // Insertion
//       operations.push({
//         type: 'insert',
//         position: cursor,
//         text,
//       });
//       cursor += text.length;
//     } else {
//       // Equal - just move the cursor
//       cursor += text.length;
//     }
//   }

//   return operations;
// }

// const TextEditor: React.FC<TextEditorProps> = ({
//   open,
//   fileId,
//   gcsKey,
//   mimeType,
//   onClose,
// }) => {
//   const [content, setContent] = useState('');
//   const [isConnected, setIsConnected] = useState(false);
//   const socketRef = useRef<WebSocket | null>(null);
//   const lastSyncedContentRef = useRef('');
//   const [lastBatchId, setLastBatchId] = useState(0);
//   const [isProcessingBatch, setIsProcessingBatch] = useState(false);
//   const batchQueueRef = useRef<OperationBatch[]>([]);
//   const currentBatchOperationsRef = useRef<Operation[]>([]);
//   const lastAcknowledgedBatchIdRef = useRef(0);
//   const localContentRef = useRef('');
//   const clientIdRef = useRef<string>('');
//   const [connectedClientIds, setConnectedClientIds] = useState<Set<string>>(
//     new Set(),
//   );
//   const [connectedClientUsernames, setConnectedClientUsernames] = useState<
//     string[]
//   >([]);

//   const { userId } = useUser();

//   // client revision tracking
//   const clientRevisionRef = useRef(0);

//   const serverUrl = process.env.REACT_APP_API_BASE_URL;
//   let wsUrl: string;
//   if (!serverUrl) {
//     wsUrl = 'ws://localhost:5001';
//   } else {
//     // Replace http:// or https:// with ws:// or wss:// respectively
//     if (serverUrl.startsWith('https://')) {
//       wsUrl = 'wss://' + serverUrl.substring(8);
//     } else if (serverUrl.startsWith('http://')) {
//       wsUrl = 'ws://' + serverUrl.substring(7);
//     } else {
//       wsUrl = 'ws://' + serverUrl;
//     }
//   }

//   useEffect(() => {
//     const fetchUsernames = async () => {
//       const idsArray = Array.from(connectedClientIds);
//       try {
//         // Map each ID to a getUsernameById Promise
//         const usernamePromises = idsArray.map((id) => getUsernameById(id));
//         const usernames = await Promise.all(usernamePromises);
//         setConnectedClientUsernames(usernames);
//       } catch (err) {
//         console.error('Failed to fetch some usernames:', err);
//       }
//     };

//     if (connectedClientIds.size > 0) {
//       fetchUsernames();
//     } else {
//       // If no IDs connected, clear out usernames
//       setConnectedClientUsernames([]);
//     }
//   }, [connectedClientIds]);

//   useEffect(() => {
//     // Single WebSocket connection
//     const ws = new WebSocket(wsUrl);
//     socketRef.current = ws;

//     ws.onopen = () => {
//       console.log('WebSocket connected');
//       setIsConnected(true);
//       ws.send(
//         JSON.stringify({
//           type: 'join-document',
//           fileId,
//           gcsKey,
//           requestClientId: true, // Request a client ID
//           userId,
//         }),
//       );
//     };

//     ws.onmessage = (event) => {
//       const message = JSON.parse(event.data);

//       if (message.type === 'client-id-assigned') {
//         clientIdRef.current = message.clientId;
//         console.log(`Assigned client ID: ${clientIdRef.current}`);
//       } else if (message.type === 'document-update') {
//         console.log('update received');
//         // Only apply updates from other clients, not our own echoed changes
//         if (
//           !message.sourceClientId ||
//           message.sourceClientId !== clientIdRef.current
//         ) {
//           console.log('Received document update from another client');

//           // Store current cursor position to restore it after update
//           const selection = window.getSelection();
//           const cursorPosition = selection?.focusOffset || 0;

//           setContent(message.content);
//           localContentRef.current = message.content;
//           lastSyncedContentRef.current = message.content;

//           // Update client revision
//           if (message.revision !== undefined) {
//             clientRevisionRef.current = message.revision;
//             console.log(
//               `Updated client revision to ${clientRevisionRef.current}`,
//             );
//           }

//           // Clear queue since we now have the latest state
//           batchQueueRef.current = [];
//           currentBatchOperationsRef.current = [];
//           setIsProcessingBatch(false);

//           // Attempt to restore cursor position after update
//           try {
//             setTimeout(() => {
//               const textElement = document.querySelector('textarea');
//               if (textElement) {
//                 textElement.focus();
//                 textElement.setSelectionRange(cursorPosition, cursorPosition);
//               }
//             }, 0);
//           } catch (e) {
//             console.log("Couldn't restore cursor position");
//           }
//         } else {
//           console.log('Ignoring echo of our own update');
//         }
//       } else if (message.type === 'operation-ack') {
//         console.log(`Received operation-ack for batch ${message.batchId}`);
//         console.log(
//           `Server revision: ${message.revision}, Current client revision: ${clientRevisionRef.current}`,
//         );

//         // Always update client revision from server
//         if (message.revision !== undefined) {
//           const oldRevision = clientRevisionRef.current;
//           clientRevisionRef.current = message.revision;
//           console.log(
//             `Updated client revision from ${oldRevision} to ${clientRevisionRef.current}`,
//           );
//         }

//         if (message.batchId) {
//           if (currentBatchOperationsRef.current.length > 0) {
//             // Send next op in the current batch
//             const nextOp = currentBatchOperationsRef.current.shift()!;
//             console.log(
//               `Sending next operation in batch ${message.batchId}, ${currentBatchOperationsRef.current.length} remaining`,
//             );

//             if (socketRef.current?.readyState === WebSocket.OPEN) {
//               socketRef.current.send(
//                 JSON.stringify({
//                   type: 'update-document',
//                   fileId,
//                   operation: nextOp,
//                   batchId: message.batchId,
//                   isLastInBatch: currentBatchOperationsRef.current.length === 0,
//                   totalInBatch:
//                     batchQueueRef.current[0]?.operations.length || 0,
//                   clientRevision: clientRevisionRef.current, // Use the updated revision
//                 }),
//               );
//             }
//           } else {
//             // batch is complete
//             console.log(`Batch ${message.batchId} complete`);
//             lastAcknowledgedBatchIdRef.current = message.batchId;

//             // If this was the last in batch, update our synced content
//             if (message.isLastInBatch) {
//               console.log(
//                 `Last operation in batch acknowledged, updating lastSyncedContent`,
//               );
//               lastSyncedContentRef.current = localContentRef.current;
//             }

//             // Remove it
//             if (
//               batchQueueRef.current.length > 0 &&
//               batchQueueRef.current[0].batchId === message.batchId
//             ) {
//               batchQueueRef.current.shift();
//               console.log(`Removed batch ${message.batchId} from queue`);
//             }

//             setIsProcessingBatch(false);
//             processBatchQueue();
//           }
//         }
//       } else if (message.type === 'user-joined') {
//         setConnectedClientIds((prevSet) => {
//           const updated = new Set(prevSet);
//           updated.add(message.clientId);
//           return updated;
//         });
//       } else if (message.type === 'user-left') {
//         setConnectedClientIds((prevSet) => {
//           const updated = new Set(prevSet);
//           updated.delete(message.clientId);
//           return updated;
//         });
//       } else if (message.type === 'user-list') {
//         const allClients: string[] = message.clients;
//         const updated = new Set(allClients);
//         setConnectedClientIds(updated);
//       }
//     };

//     ws.onerror = (error) => {
//       console.error('WebSocket error:', error);
//       setIsConnected(false);
//     };

//     ws.onclose = () => {
//       console.log('WebSocket disconnected');
//       setIsConnected(false);
//     };

//     return () => {
//       if (ws.readyState === WebSocket.OPEN) {
//         ws.send(JSON.stringify({ type: 'leave-document', fileId }));
//       }
//       ws.close();
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [fileId]);

//   // set up debounced change handler, prevent overloading client
//   const debouncedProcessChanges = useRef(
//     debounce((newContent: string) => {
//       if (!socketRef.current) {
//         return;
//       }

//       const oldContent = localContentRef.current;
//       localContentRef.current = newContent;

//       if (oldContent === newContent) {
//         return; // No changes
//       }

//       // Get ops
//       const operations = computeOperationsFromDiff(oldContent, newContent);
//       if (operations.length === 0) {
//         return;
//       }

//       // Create a new batch
//       const newBatchId = lastBatchId + 1;
//       setLastBatchId(newBatchId);

//       // IMPORTANT: Log the current revision we're using
//       console.log(
//         `Creating new batch ${newBatchId} at revision ${clientRevisionRef.current}`,
//       );

//       const batch: OperationBatch = {
//         operations,
//         batchId: newBatchId,
//         clientRevision: clientRevisionRef.current,
//       };

//       // Add to queue
//       batchQueueRef.current.push(batch);
//       processBatchQueue();
//     }, 100),
//   ).current;

//   // process the batch queue
//   const processBatchQueue = () => {
//     if (
//       isProcessingBatch ||
//       batchQueueRef.current.length === 0 ||
//       !socketRef.current ||
//       socketRef.current.readyState !== WebSocket.OPEN
//     ) {
//       return;
//     }

//     setIsProcessingBatch(true);
//     const currentBatch = batchQueueRef.current[0];
//     currentBatchOperationsRef.current = [...currentBatch.operations];

//     // Send the first operation of the batch
//     if (currentBatchOperationsRef.current.length > 0) {
//       const firstOp = currentBatchOperationsRef.current.shift()!;

//       socketRef.current.send(
//         JSON.stringify({
//           type: 'update-document',
//           fileId,
//           operation: firstOp,
//           batchId: currentBatch.batchId,
//           isLastInBatch: currentBatchOperationsRef.current.length === 0,
//           totalInBatch: currentBatch.operations.length,
//           clientRevision: currentBatch.clientRevision,
//         }),
//       );
//     } else {
//       // somehow we have an empty batch, remove it and process the next one
//       batchQueueRef.current.shift();
//       setIsProcessingBatch(false);
//       processBatchQueue();
//     }
//   };

//   const handleChange = (newContent: string) => {
//     // Update UI immediately for responsiveness
//     setContent(newContent);

//     // Process actual changes with debouncing for stability
//     debouncedProcessChanges(newContent);
//   };

//   const handleSave = () => {
//     if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
//       socketRef.current.send(
//         JSON.stringify({
//           type: 'save-document',
//           fileId,
//           mimeType,
//           gcsKey,
//         }),
//       );
//     }
//   };

//   return (
//     <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
//       <DialogContent
//         sx={{
//           display: 'flex',
//           flexDirection: 'column',
//           gap: 2,
//           position: 'relative',
//           height: '80vh',
//         }}
//       >
//         <Box
//           sx={{
//             display: 'flex',
//             alignItems: 'center',
//             flexWrap: 'wrap',
//             gap: 1,
//           }}
//         >
//           <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
//             Connected Clients:
//           </Typography>
//           {connectedClientUsernames.map((username) => (
//             <Chip key={username} label={username} color="primary" />
//           ))}
//         </Box>
//         <div style={{ flexGrow: 1 }}>
//           <TextViewer
//             fileType={mimeType}
//             content={content}
//             onChange={handleChange}
//             readOnly={!isConnected}
//           />
//         </div>
//         <div style={{ display: 'flex', justifyContent: 'space-between' }}>
//           <span>
//             {isConnected
//               ? `Connected (Rev: ${clientRevisionRef.current})`
//               : 'Disconnected'}
//           </span>
//           <button onClick={handleSave} disabled={!isConnected}>
//             Save
//           </button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default TextEditor;

import { Box, Chip, Dialog, DialogContent, Typography } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import TextViewer from './TextViewer';
import { diff_match_patch } from 'diff-match-patch';
import { debounce } from 'lodash';
import { useUser } from '../context/UserContext';
import { getUsernameById } from '../utils/helperRequests';

// Operation types (shared with server)
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

export type Operation = InsertOperation | DeleteOperation;

interface OperationBatch {
  operations: Operation[];
  batchId: number;
  clientRevision: number;
}

interface TextEditorProps {
  open: boolean;
  fileId: string;
  gcsKey: string;
  mimeType: string;
  onClose: () => void;
}

// Apply an operation to a string (client-side equivalent)
function applyOperationToContent(content: string, op: Operation): string {
  if (op.type === 'insert') {
    return content.slice(0, op.position) + op.text + content.slice(op.position);
  } else if (op.type === 'delete') {
    return (
      content.slice(0, op.position) + content.slice(op.position + op.length)
    );
  }
  return content;
}

// Compute diff operations from two content versions
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
      operations.push({
        type: 'delete',
        position: cursor,
        length: text.length,
      });
    } else if (type === 1) {
      operations.push({
        type: 'insert',
        position: cursor,
        text,
      });
      cursor += text.length;
    } else {
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
  const clientIdRef = useRef<string>('');
  const [connectedClientIds, setConnectedClientIds] = useState<Set<string>>(
    new Set(),
  );
  const [connectedClientUsernames, setConnectedClientUsernames] = useState<
    string[]
  >([]);
  const { userId } = useUser();
  // client revision tracking
  const clientRevisionRef = useRef(0);

  const serverUrl = process.env.REACT_APP_API_BASE_URL;
  let wsUrl: string;
  if (!serverUrl) {
    wsUrl = 'ws://localhost:5001';
  } else {
    if (serverUrl.startsWith('https://')) {
      wsUrl = 'wss://' + serverUrl.substring(8);
    } else if (serverUrl.startsWith('http://')) {
      wsUrl = 'ws://' + serverUrl.substring(7);
    } else {
      wsUrl = 'ws://' + serverUrl;
    }
  }

  useEffect(() => {
    const fetchUsernames = async () => {
      const idsArray = Array.from(connectedClientIds);
      try {
        const usernamePromises = idsArray.map((id) => getUsernameById(id));
        const usernames = await Promise.all(usernamePromises);
        setConnectedClientUsernames(usernames);
      } catch (err) {
        console.error('Failed to fetch some usernames:', err);
      }
    };

    if (connectedClientIds.size > 0) {
      fetchUsernames();
    } else {
      setConnectedClientUsernames([]);
    }
  }, [connectedClientIds]);

  useEffect(() => {
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
          requestClientId: true,
          userId,
        }),
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'client-id-assigned') {
        clientIdRef.current = message.clientId;
        console.log(`Assigned client ID: ${clientIdRef.current}`);
      } else if (message.type === 'document-init') {
        // Initial full state update when joining the document
        console.log('Received document init');
        setContent(message.content);
        localContentRef.current = message.content;
        lastSyncedContentRef.current = message.content;
        if (message.revision !== undefined) {
          clientRevisionRef.current = message.revision;
          console.log(
            `Updated client revision to ${clientRevisionRef.current}`,
          );
        }
      } else if (message.type === 'document-diff') {
        // Diff update from another client
        if (message.sourceClientId !== clientIdRef.current) {
          console.log('Applying diff from another client');
          const op: Operation = message.operation;
          const newContent = applyOperationToContent(
            localContentRef.current,
            op,
          );
          setContent(newContent);
          localContentRef.current = newContent;
        } else {
          console.log('Received own diff echo; ignoring content update.');
        }
        if (message.revision !== undefined) {
          clientRevisionRef.current = message.revision;
        }
      } else if (message.type === 'operation-ack') {
        console.log(`Received operation-ack for batch ${message.batchId}`);
        if (message.revision !== undefined) {
          const oldRevision = clientRevisionRef.current;
          clientRevisionRef.current = message.revision;
          console.log(
            `Updated client revision from ${oldRevision} to ${clientRevisionRef.current}`,
          );
        }
        if (message.batchId) {
          if (currentBatchOperationsRef.current.length > 0) {
            const nextOp = currentBatchOperationsRef.current.shift()!;
            console.log(
              `Sending next operation in batch ${message.batchId}, ${currentBatchOperationsRef.current.length} remaining`,
            );
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
            console.log(`Batch ${message.batchId} complete`);
            lastAcknowledgedBatchIdRef.current = message.batchId;
            if (message.isLastInBatch) {
              console.log(
                `Last operation in batch acknowledged, updating synced content`,
              );
              lastSyncedContentRef.current = localContentRef.current;
            }
            if (
              batchQueueRef.current.length > 0 &&
              batchQueueRef.current[0].batchId === message.batchId
            ) {
              batchQueueRef.current.shift();
              console.log(`Removed batch ${message.batchId} from queue`);
            }
            setIsProcessingBatch(false);
            processBatchQueue();
          }
        }
      } else if (message.type === 'user-joined') {
        setConnectedClientIds((prevSet) => {
          const updated = new Set(prevSet);
          updated.add(message.clientId);
          return updated;
        });
      } else if (message.type === 'user-left') {
        setConnectedClientIds((prevSet) => {
          const updated = new Set(prevSet);
          updated.delete(message.clientId);
          return updated;
        });
      } else if (message.type === 'user-list') {
        const allClients: string[] = message.clients;
        setConnectedClientIds(new Set(allClients));
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
  }, [fileId, wsUrl, gcsKey, userId]);

  // Process changes with debouncing to avoid flooding updates
  const debouncedProcessChanges = useRef(
    debounce((newContent: string) => {
      if (!socketRef.current) return;
      const oldContent = localContentRef.current;
      localContentRef.current = newContent;
      if (oldContent === newContent) return;
      const operations = computeOperationsFromDiff(oldContent, newContent);
      if (operations.length === 0) return;
      const newBatchId = lastBatchId + 1;
      setLastBatchId(newBatchId);
      console.log(
        `Creating new batch ${newBatchId} at revision ${clientRevisionRef.current}`,
      );
      const batch: OperationBatch = {
        operations,
        batchId: newBatchId,
        clientRevision: clientRevisionRef.current,
      };
      batchQueueRef.current.push(batch);
      processBatchQueue();
    }, 100),
  ).current;

  // Process the batch queue for sending operations
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
      batchQueueRef.current.shift();
      setIsProcessingBatch(false);
      processBatchQueue();
    }
  };

  const handleChange = (newContent: string) => {
    setContent(newContent);
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
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Connected Clients:
          </Typography>
          {connectedClientUsernames.map((username) => (
            <Chip key={username} label={username} color="primary" />
          ))}
        </Box>
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
