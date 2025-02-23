// server.js
const express = require('express');
const path = require('path');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;
const SERVER_NAME = process.env.SERVER_NAME || `Dev-Server-${PORT}`;

// Keep track of all connected clients
const clients = new Set();
let currentText = '';

// WebSocket connection handling
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`Client connected. Total clients: ${clients.size}`);
  
  // Send current text to newly connected client
  ws.send(JSON.stringify({ type: 'sync', text: currentText }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'update') {
        currentText = data.text;
        // Broadcast to all other clients
        clients.forEach((client) => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify({ type: 'sync', text: currentText }));
          }
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`Client disconnected. Total clients: ${clients.size}`);
  });
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));

// Add CORS headers to allow development server access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Endpoint to get server info
app.get('/api/server-info', (req, res) => {
  res.json({
    wsPort: PORT
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ${SERVER_NAME} is running at http://localhost:${PORT}`);
  console.log(`WebSocket server is running on ws://localhost:${PORT}`);
  console.log(`To stop this server, press Ctrl+C`);
});