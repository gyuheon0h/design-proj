import { Server as WebSocketServer } from 'ws';
import { Server } from 'http';
import StorageService from './storage';

// In-memory document store
const documents = new Map<
  string,
  { content: string; ops: any[]; clients: Set<any> }
>();

// OT Transformation Function
function transform(opA: any, opB: any) {
  if (!opA || !opB) {
    return opA;
  }

  if (opA.type === 'insert' && opB.type === 'insert') {
    return opA.position <= opB.position
      ? opA
      : { ...opA, position: opA.position + 1 };
  }

  if (opA.type === 'delete' && opB.type === 'insert') {
    return opA.position < opB.position
      ? opA
      : { ...opA, position: opA.position + 1 };
  }

  if (opA.type === 'insert' && opB.type === 'delete') {
    return opA.position < opB.position
      ? opA
      : { ...opA, position: Math.max(opA.position - 1, 0) };
  }

  if (opA.type === 'delete' && opB.type === 'delete') {
    if (opA.position < opB.position) {
      return opA;
    } else if (opA.position > opB.position) {
      return { ...opA, position: opA.position - 1 };
    }
    // If same position, assume one deletion takes precedence
    return null;
  }

  // If unknown operation type, return opA unchanged
  return { ...opA };
}

// WebSocket Setup
export default function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    ws.on('message', async (message: string) => {
      const { type, fileId, operation, mimeType, gcsKey } = JSON.parse(message);

      if (type === 'join-document') {
        if (!documents.has(fileId)) {
          const fileContent = await StorageService.getGCSFile(gcsKey);
          documents.set(fileId, {
            content: fileContent,
            ops: [],
            clients: new Set(),
          });
        }
        documents.get(fileId)!.clients.add(ws);
        ws.send(
          JSON.stringify({
            type: 'document-update',
            content: documents.get(fileId)!.content,
          }),
        );
      }

      if (type === 'update-document') {
        const doc = documents.get(fileId);
        if (!doc) return;

        // Transform new operation with existing ones
        let transformedOp = operation;
        for (const prevOp of doc.ops) {
          if (!transformedOp) {
            // No need to transform further
            break;
          }
          transformedOp = transform(transformedOp, prevOp);
        }

        // After the loop, if it's still null, don't apply it
        if (!transformedOp) {
          return; // skip applying a null operation
        }

        // Apply operation
        if (transformedOp.type === 'insert') {
          doc.content =
            doc.content.slice(0, transformedOp.position) +
            transformedOp.char +
            doc.content.slice(transformedOp.position);
        } else if (transformedOp.type === 'delete') {
          doc.content =
            doc.content.slice(0, transformedOp.position) +
            doc.content.slice(transformedOp.position + 1);
        }

        // Store operation
        doc.ops.push(transformedOp);

        // Broadcast updates
        doc.clients.forEach((client) => {
          if (client !== ws) {
            client.send(
              JSON.stringify({
                type: 'document-update',
                content: doc.content,
              }),
            );
          }
        });
      }

      if (type === 'leave-document') {
        // Remove this client from the document’s set
        const doc = documents.get(fileId);
        if (doc) {
          doc.clients.delete(ws);
          // If no more clients are connected, remove the doc from memory
          if (doc.clients.size === 0) {
            documents.delete(fileId);
          }
        }
      }

      if (type === 'save-document') {
        if (documents.has(fileId)) {
          await StorageService.saveToGCS(
            gcsKey,
            documents.get(fileId)!.content,
            mimeType,
          );
        }
      }
    });

    // When the websocket closes, remove it from all documents it was in
    ws.on('close', () => {
      documents.forEach((doc, fileId) => {
        doc.clients.delete(ws);
        if (doc.clients.size === 0) {
          documents.delete(fileId);
        }
      });
    });
  });

  console.log('WebSocket server is running.');
}
