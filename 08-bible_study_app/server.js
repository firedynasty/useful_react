// server.js
const express = require('express');
const path = require('path');
const fetch = require('node-fetch'); // Use node-fetch instead of ollama

const app = express();
const PORT = process.env.PORT || 3001;  // Use a different port than your React app

// Middleware to parse JSON
app.use(express.json());

// Add CORS headers to allow React development server access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Serve static files from the build directory (when deploying)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running!' });
});

// Handle Ollama requests
app.post('/api/ask-query', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'No query provided' });
  }

  try {
    console.log('Querying Ollama with:', query);
    
    // Use fetch to directly call the Ollama API
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2',
        messages: [{ role: 'user', content: query }],
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received response from Ollama');
    res.json({ reply: data.message.content });
  } catch (error) {
    console.error('Ollama API error:', error);
    res.status(500).json({ 
      error: `Failed to get response from Ollama: ${error.message}`,
    });
  }
});

// For React Router, send all unhandled requests to index.html in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});