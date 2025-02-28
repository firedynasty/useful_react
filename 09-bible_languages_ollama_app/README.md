# Bible Study Application

## Overview

This Bible Study Application is an interactive tool that allows users to read the King James Version of the Bible and ask questions about the scripture they're reading. The application uses a React frontend with an Express backend server that communicates with a local Ollama instance to provide AI-powered responses to user queries about the biblical text.

## Features

- **Complete Bible Text**: Browse all books and chapters of the King James Version Bible
- **Interactive Navigation**: Easily switch between books and chapters with a user-friendly interface
- **AI-Powered Scripture Study**: Ask questions about the text you're reading and receive contextual responses
- **Conversational Context**: The AI remembers previous responses to maintain context in your study session
- **Keyboard Shortcuts**: Use Enter to send questions and Shift+Enter for new lines

## Technical Requirements

- Node.js and npm/yarn
- A running Ollama instance with a suitable model for biblical questions (localhost:3001)
- The `en_kjv.json` Bible data file accessible via your web server

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/bible-study-app.git
   cd bible-study-app
   ```

2. Install dependencies:

   ```bash
   npm install
   # Also install server dependencies if in a separate package.json
   # For example: npm install --prefix server
   ```

3. Make sure you have Ollama running locally:

   ```bash
   # Start Ollama with llama3.2 model
   ollama run llama3.2
   ```

   This should be running on the default port (11434).

4. Start the React development server first:

   ```bash
   # In one terminal window
   npm start
   ```

   This will start the client application, typically on port 3000.

5. Start the Express server (handles communication with Ollama):

   ```bash
   # In another terminal window
   npm run server
   # Or directly using Node
   node server.js
   ```

   This will start the server on port 3001.

The order is important to ensure proper port allocation and connection between the client and server.

## Project Structure

- `BibleApp.js`: Main React component for the application
- `server.js`: Express server that handles communication with Ollama
- `en_kjv.json`: JSON file containing the entire KJV Bible structured by books and chapters

## Usage

1. **Selecting a Book and Chapter**:
   - Choose a book from the sidebar on the left
   - Select a chapter from the dropdown menu at the top
2. **Reading the Scripture**:
   - The main panel displays the text of the selected chapter
   - Navigate between chapters using the "Previous Chapter" and "Next Chapter" buttons
3. **Asking Questions**:
   - Type your question in the text area on the right
   - Press Enter or click the Send button to submit your question
   - Use Shift+Enter to create a new line in your question
4. **Viewing Responses**:
   - AI responses appear in the panel above the question input
   - The system includes previous responses as context for new questions
   - Each response is specific to the book and chapter you're currently viewing

## API Integration

The application uses a two-tier architecture:

1. **Express Server (server.js)**:
   - Runs on port 3001
   - Handles requests from the React frontend
   - Communicates with the Ollama API
   - Provides endpoints:
     - `GET /api/health`: Health check endpoint
     - `POST /api/ask-query`: Forwards queries to Ollama and returns responses
2. **Ollama API**:
   - Runs locally on port 11434
   - Provides the AI model (llama3.2) for responding to Bible questions

### API Flow:

1. React Frontend → Express Server:

   - Endpoint: `http://localhost:3001/api/ask-query`
   - Method: POST
   - Payload: `{ query: "Context information and user question" }`
   - Response: `{ reply: "AI response text" }`

2. Express Server → Ollama:

   - Endpoint: `http://localhost:11434/api/chat`

   - Method: POST

   - Payload:

     ```json
     {  "model": "llama3.2",  "messages": [{"role": "user", "content": "query"}],  "stream": false}
     ```

## Customization

- **Bible Translation**: Replace the `en_kjv.json` file with another translation if desired
- **AI Model**: Configure the backend to use different Ollama models for varied response styles
- **UI Styling**: The app uses Tailwind CSS classes for easy styling customization

## Troubleshooting

- **Loading Issues**: If Bible data doesn't load, check that `en_kjv.json` is accessible to your web server

- Connection Errors

  :

  - Ensure Express server is running on port 3001
  - Ensure Ollama is running at the expected address (localhost:11434)
  - Check server console logs for API errors

- **CORS Issues**: If seeing CORS errors in browser console, verify the Express server CORS headers are configured correctly

- **Response Quality**: Try different Ollama models if responses aren't meeting expectations

- **Server Not Running**: If you get connection refused errors, make sure to run both `npm start` and `npm run server` in separate terminals, in that specific order

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

------

*This application is intended for educational and personal study purposes only.*
