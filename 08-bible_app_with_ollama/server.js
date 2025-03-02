// server.js
const express = require('express');
const path = require('path');
const fetch = require('node-fetch'); // Use node-fetch instead of ollama

const app = express();
const PORT = process.env.PORT || 3001;  // Use a different port than your React app

// Middleware to parse JSON
app.use(express.json());

// Add proper CORS handling middleware
app.use((req, res, next) => {
  // Set the specific origin instead of wildcard '*' for better security
  // In development, this is likely to be 'http://localhost:3000'
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  // Allow credentials to be sent with the request (cookies, auth headers)
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Enhanced logging middleware with full response capture
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Request received`);
  
  // Capture the original res.json function
  const originalJson = res.json;
  
  // Override the json method to log responses
  res.json = function(data) {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Response sent (${duration}ms)`);
    
    // For Ollama responses, log the full response
    if (req.url === '/api/ask-query' && data.reply) {
      console.log('\n========== OLLAMA FULL RESPONSE ==========');
      console.log(`Length of response: ${data.reply.length} characters`);
      console.log('Response content:');
      console.log(data.reply); // Log the full response
      console.log('==========================================\n');
    }
    
    return originalJson.call(this, data);
  };
  
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

// Handle Ollama requests with improved logging
app.post('/api/ask-query', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'No query provided' });
  }

  try {
    console.log('\n========== OLLAMA REQUEST ==========');
    console.log('Query sent to Ollama:');
    console.log(query); // Log the full query
    console.log('Timestamp:', new Date().toISOString());
    console.log('Connecting to Ollama at: http://127.0.0.1:11434/api/chat');
    console.log('====================================\n');
    
    const startTime = Date.now();
    
    // Use fetch to directly call the Ollama API
    // Using 127.0.0.1 explicitly instead of localhost
    const response = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2',
        messages: [{ role: 'user', content: query }],
        stream: false
      }),
      // Add a timeout to fail faster if connection issues persist
      timeout: 60000
    });

    const endTime = Date.now();
    console.log(`Ollama response time: ${endTime - startTime}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama API responded with error status:', response.status);
      console.error('Error response body:', errorText);
      throw new Error(`Ollama API responded with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log('\n========== OLLAMA RESPONSE RECEIVED ==========');
    console.log('Response received at:', new Date().toISOString());
    console.log('Total processing time:', Date.now() - startTime, 'ms');
    console.log('==============================================\n');
    
    // Check if the response has the expected structure
    if (!data.message || !data.message.content) {
      console.error('Unexpected response structure from Ollama:', JSON.stringify(data));
      return res.status(500).json({ 
        error: 'Received an unexpected response format from Ollama',
        details: JSON.stringify(data)
      });
    }
    
    res.json({ reply: data.message.content });
  } catch (error) {
    console.error('\n========== OLLAMA ERROR ==========');
    console.error('Error type:', error.name);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('==================================\n');
    
    // Provide different error messages based on error types
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ 
        error: 'Unable to connect to Ollama. Is the Ollama server running at port 11434?',
        details: error.message
      });
    } else if (error.type === 'request-timeout' || error.name === 'AbortError') {
      res.status(504).json({ 
        error: 'The request to Ollama timed out. Ollama might be overloaded or not responding.',
        details: error.message
      });
    } else {
      res.status(500).json({ 
        error: `Failed to get response from Ollama: ${error.message}`,
        details: error.stack
      });
    }
  }
});

// For React Router, send all unhandled requests to index.html in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Add a test endpoint to verify Ollama connectivity directly
app.get('/api/test-ollama', async (req, res) => {
  try {
    console.log('Testing Ollama connectivity...');
    const response = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2',
        messages: [{ role: 'user', content: 'Hello, are you working?' }],
        stream: false
      }),
      timeout: 5000
    });

    if (!response.ok) {
      throw new Error(`Ollama test failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Log full test response too
    console.log('\n========== OLLAMA TEST RESPONSE ==========');
    console.log(data.message.content);
    console.log('=========================================\n');
    
    res.json({ 
      status: 'ok', 
      message: 'Successfully connected to Ollama',
      ollamaResponse: data.message.content
    });
  } catch (error) {
    console.error('Ollama test error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: `Failed to connect to Ollama: ${error.message}`
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
  console.log(`Ollama test endpoint available at: http://localhost:${PORT}/api/test-ollama`);
});