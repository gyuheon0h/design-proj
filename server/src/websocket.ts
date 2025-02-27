// WebSocketServer.ts - Server-side implementation
import { Server as WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import StorageService from './storage';

// operation types
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

interface ClientInfo {
  id: string;
  pendingOps: number; // Track pending opsfor this client
}

// Document state with revision history
interface DocumentState {
  content: string;
  revision: number;
  history: Operation[];
  clients: Map<WebSocket, ClientInfo>;
}

// In-memory document store
const documents = new Map<string, DocumentState>();

function generateClientId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// OT Transformation Functions
function transformInsertInsert(
  opA: InsertOperation,
  opB: InsertOperation,
): InsertOperation {
  if (opA.position <= opB.position) {
    return opA;
  } else {
    return {
      ...opA,
      position: opA.position + opB.text.length,
    };
  }
}

function transformInsertDelete(
  opA: InsertOperation,
  opB: DeleteOperation,
): InsertOperation {
  if (opA.position <= opB.position) {
    return opA;
  } else if (opA.position >= opB.position + opB.length) {
    return {
      ...opA,
      position: opA.position - opB.length,
    };
  } else {
    // Insert position is within delete range
    return {
      ...opA,
      position: opB.position,
    };
  }
}

function transformDeleteInsert(
  opA: DeleteOperation,
  opB: InsertOperation,
): DeleteOperation {
  if (opA.position >= opB.position) {
    return {
      ...opA,
      position: opA.position + opB.text.length,
    };
  } else if (opA.position + opA.length <= opB.position) {
    return opA;
  } else {
    // Delete range overlaps with insert position
    return {
      ...opA,
      length: opA.length + opB.text.length,
    };
  }
}

function transformDeleteDelete(
  opA: DeleteOperation,
  opB: DeleteOperation,
): DeleteOperation | null {
  if (opA.position >= opB.position + opB.length) {
    // opA is after opB
    return {
      ...opA,
      position: opA.position - opB.length,
    };
  } else if (opA.position + opA.length <= opB.position) {
    // opA is before opB
    return opA;
  } else if (
    opA.position >= opB.position &&
    opA.position + opA.length <= opB.position + opB.length
  ) {
    // opA is contained within opB
    return null; // This operation is overwiten
  } else if (
    opA.position <= opB.position &&
    opA.position + opA.length >= opB.position + opB.length
  ) {
    // opA contains opB
    return {
      ...opA,
      length: opA.length - opB.length,
    };
  } else if (opA.position < opB.position) {
    // opA overlaps with start of opB
    return {
      ...opA,
      length: opB.position - opA.position,
    };
  } else {
    // opA overlaps with end of opB
    const newPosition = opB.position;
    const newLength = opA.position + opA.length - (opB.position + opB.length);
    return {
      type: 'delete',
      position: newPosition,
      length: newLength > 0 ? newLength : 0,
    };
  }
}

// Main transformation function
function transform(opA: Operation, opB: Operation): Operation | null {
  if (opA.type === 'insert' && opB.type === 'insert') {
    return transformInsertInsert(opA, opB);
  } else if (opA.type === 'insert' && opB.type === 'delete') {
    return transformInsertDelete(opA, opB);
  } else if (opA.type === 'delete' && opB.type === 'insert') {
    return transformDeleteInsert(opA, opB);
  } else if (opA.type === 'delete' && opB.type === 'delete') {
    return transformDeleteDelete(
      opA as DeleteOperation,
      opB as DeleteOperation,
    );
  }

  return opA; // fallback
}

// apply an operation to a document
function applyOperation(content: string, op: Operation): string {
  if (op.type === 'insert') {
    return content.slice(0, op.position) + op.text + content.slice(op.position);
  } else if (op.type === 'delete') {
    return (
      content.slice(0, op.position) + content.slice(op.position + op.length)
    );
  }
  return content;
}

// WebSocket Server Setup
export default function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    const clientId = generateClientId();
    console.log(`Client connected: ${clientId}`);

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        const { type, fileId, mimeType, gcsKey } = data;

        switch (type) {
          case 'join-document': {
            // Create or retrieve document
            if (!documents.has(fileId)) {
              console.log(`Creating new document: ${fileId}`);
              try {
                const fileContent = await StorageService.getGCSFile(gcsKey);
                documents.set(fileId, {
                  content: fileContent,
                  revision: 0,
                  history: [],
                  clients: new Map(),
                });
              } catch (error) {
                console.error(`Error loading document ${fileId}:`, error);
                ws.send(
                  JSON.stringify({
                    type: 'error',
                    message: 'Failed to load document',
                  }),
                );
                return;
              }
            }

            const doc = documents.get(fileId)!;

            // add client to the document
            doc.clients.set(ws, { id: clientId, pendingOps: 0 });

            // send current document state
            ws.send(
              JSON.stringify({
                type: 'document-update',
                content: doc.content,
                revision: doc.revision,
              }),
            );

            console.log(`Client ${clientId} joined document ${fileId}`);
            break;
          }

          case 'update-document': {
            const doc = documents.get(fileId);
            if (!doc) {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Document not found',
                }),
              );
              return;
            }

            // get client info
            const clientInfo = doc.clients.get(ws);
            if (!clientInfo) {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Client not registered for this document',
                }),
              );
              return;
            }

            // Extract batch information
            const { operation, batchId, isLastInBatch } = data;

            // Increment right when we receive a new operation
            clientInfo.pendingOps++;

            // transform operation against all operations that the client hasn't seen
            let transformedOp: Operation | null = operation;
            const clientRevision = doc.revision - clientInfo.pendingOps + 1;

            for (let i = clientRevision; i < doc.revision; i++) {
              if (!transformedOp) break;
              transformedOp = transform(transformedOp, doc.history[i]);
            }

            // don't apply ops nullified by transformations
            if (!transformedOp) {
              clientInfo.pendingOps--;
              ws.send(
                JSON.stringify({
                  type: 'operation-ack',
                  revision: doc.revision,
                  batchId, // include batch info in acknowledgment
                  isLastInBatch,
                }),
              );
              return;
            }

            // apply operation to document
            doc.content = applyOperation(doc.content, transformedOp);
            doc.revision++;
            doc.history.push(transformedOp);

            clientInfo.pendingOps--;

            // acknowledge the operation to the sender
            ws.send(
              JSON.stringify({
                type: 'operation-ack',
                revision: doc.revision,
                batchId, // include batch info in acknowledgment
                isLastInBatch,
              }),
            );

            // If this is the last operation in a batch and there have been multiple
            // operations, send a full document update to all clients
            if (isLastInBatch) {
              // broadcast to all clients
              doc.clients.forEach((info, client) => {
                client.send(
                  JSON.stringify({
                    type: 'document-update',
                    content: doc.content,
                    revision: doc.revision,
                  }),
                );
              });
            } else {
              // For intermediate operations, only broadcast to other clients
              doc.clients.forEach((info, client) => {
                if (client !== ws) {
                  client.send(
                    JSON.stringify({
                      type: 'document-update',
                      content: doc.content,
                      revision: doc.revision,
                    }),
                  );
                }
              });
            }

            break;
          }

          case 'leave-document': {
            const doc = documents.get(fileId);
            if (doc) {
              doc.clients.delete(ws);
              console.log(`Client ${clientId} left document ${fileId}`);

              // Clean up if no clients are left
              if (doc.clients.size === 0) {
                documents.delete(fileId);
                console.log(`Document ${fileId} removed from memory`);
              }
            }
            break;
          }
          // TODO UPDATE FILE METADATA
          case 'save-document': {
            const doc = documents.get(fileId);
            if (doc) {
              try {
                await StorageService.saveToGCS(gcsKey, doc.content, mimeType);
                ws.send(
                  JSON.stringify({
                    type: 'save-success',
                    message: 'Document saved successfully',
                  }),
                );
                console.log(`Document ${fileId} saved to GCS`);
              } catch (error) {
                console.error(`Error saving document ${fileId}:`, error);
                ws.send(
                  JSON.stringify({
                    type: 'error',
                    message: 'Failed to save document',
                  }),
                );
              }
            } else {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Document not found',
                }),
              );
            }
            break;
          }
        }
      } catch (error) {
        console.error('Error processing message:', error);
        ws.send(
          JSON.stringify({
            type: 'error',
            message: 'Invalid message format',
          }),
        );
      }
    });

    // Cleanup
    ws.on('close', () => {
      console.log(`Client disconnected: ${clientId}`);

      // remove client from all documents
      documents.forEach((doc, fileId) => {
        if (doc.clients.has(ws)) {
          doc.clients.delete(ws);
          console.log(`Client ${clientId} removed from document ${fileId}`);

          // clean up if no clients are left
          if (doc.clients.size === 0) {
            documents.delete(fileId);
            console.log(`Document ${fileId} removed from memory`);
          }
        }
      });
    });
  });

  console.log('WebSocket server is running.');
}
