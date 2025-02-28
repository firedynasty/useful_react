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
    console.log('Attempting to connect to Ollama at: http://127.0.0.1:11434/api/chat');
    
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
      timeout: 10000
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama API responded with error status:', response.status);
      console.error('Error response body:', errorText);
      throw new Error(`Ollama API responded with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Received response from Ollama');
    
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
    console.error('Ollama API error:', error);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
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

// Handle saving templates
app.post('/api/save-templates', async (req, res) => {
  const { templates } = req.body;

  if (!templates) {
    return res.status(400).json({ success: false, error: 'No templates provided' });
  }

  try {
    // Write to the templates.json file
    const fs = require('fs');
    const path = require('path');
    
    // Determine correct path - in production it might be different
    const templatesPath = process.env.NODE_ENV === 'production' 
      ? path.join(__dirname, 'build', 'templates.json')
      : path.join(__dirname, 'public', 'templates.json');
    
    // Ensure the directory exists
    const directory = path.dirname(templatesPath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    
    // Write the file
    fs.writeFileSync(templatesPath, JSON.stringify(templates, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving templates:', error);
    res.status(500).json({ 
      success: false,
      error: `Failed to save templates: ${error.message}`,
    });
  }
});

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

// For React Router, send all unhandled requests to index.html in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
  console.log(`Ollama test endpoint available at: http://localhost:${PORT}/api/test-ollama`);
});