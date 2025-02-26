import app from './app';
import http from 'http';
import setupWebSocketServer from './websocket';

const PORT = process.env.PORT || 5001;

// Create an HTTP server and pass the Express app
const server = http.createServer(app);

// Attach WebSocket server to the HTTP server
setupWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
