const express = require('express');
const path = require('path');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;
const SERVER_NAME = process.env.SERVER_NAME || `Dev-Server-${PORT}`;

const clients = new Set();
let currentContent = {
  type: 'text',
  data: ''
};

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`Client connected. Total clients: ${clients.size}`);
  
  // Send current content to newly connected client
  ws.send(JSON.stringify({ type: 'sync', content: currentContent }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'update') {
        currentContent = {
          type: data.contentType,
          data: data.content
        };
        // Broadcast to all other clients
        clients.forEach((client) => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify({ 
              type: 'sync', 
              content: currentContent 
            }));
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

app.use(express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/api/server-info', (req, res) => {
  res.json({
    wsPort: PORT
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ${SERVER_NAME} is running at http://localhost:${PORT}`);
  console.log(`WebSocket server is running on ws://localhost:${PORT}`);
});