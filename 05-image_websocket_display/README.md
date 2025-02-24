

# Real-Time Content Sharing App

A lightweight web application that enables real-time sharing of text and images across multiple devices. Perfect for quick content sharing in local networks or for collaborative sessions.

## Features

- **Real-time Synchronization**: Content updates instantly across all connected devices
- **Multi-format Support**: Share both text and images seamlessly
- **Connection Status**: Live connection status indicator
- **Clipboard Integration**: One-click copying for shared text
- **Responsive Design**: Works on both desktop and mobile devices

## Technical Stack

- **Frontend**: React.js with Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Backend**: Node.js with Express
- **Real-time Communication**: WebSocket (ws)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd [your-repo-name]
```

2. Install dependencies:
```bash
npm install
```

3. Install required packages:
```bash
npm install @radix-ui/react-tabs
```

### Running the Application

1. Start the server:
```bash
node server.js
```

2. In a separate terminal, start the React development server:
```bash
npm start
```

3. Access the application:
- Open `http://localhost:3000` in your browser
- To share across devices, use your computer's IP address (e.g., `http://192.168.1.100:3000`)

## Usage

1. **Sharing Text**:
   - Select the "Text" tab
   - Type or paste your text
   - Click "Share Text"
   - Text appears instantly on all connected devices

2. **Sharing Images**:
   - Select the "Image" tab
   - Click "Select Image"
   - Choose an image file
   - Image appears instantly on all connected devices

3. **Copying Shared Text**:
   - Click "Copy to Clipboard" below shared text
   - A confirmation message appears when copied

## Network Configuration

- By default, the server runs on port 3001
- The WebSocket server runs on the same port
- For local network sharing, ensure both ports 3000 and 3001 are accessible

## Development Notes

- The application uses WebSocket for real-time updates
- Image sharing is handled through base64 encoding
- Connection status is monitored with automatic reconnection attempts
- UI components are based on shadcn/ui's design system

## Troubleshooting

1. **Connection Issues**:
   - Ensure the server is running
   - Check if ports 3000 and 3001 are available
   - Verify network connectivity between devices

2. **Image Upload Problems**:
   - Check file size (large images may take longer to process)
   - Ensure the file is a valid image format

## License

MIT License - feel free to use and modify as needed.





