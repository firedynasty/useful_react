# Content Sharing App

A real-time content sharing application that synchronizes text and images across multiple devices.

## Overview

This application allows users to easily share content across multiple devices in real-time. Whether you're sharing text snippets or images, any updates made from one device are instantly visible on all connected devices.

Key features:
- Real-time text and image sharing
- Automatic clipboard integration
- Multi-device synchronization
- Responsive design for desktop and mobile

## How It Works

The application consists of two main components:
1. A React-based frontend for user interaction
2. A WebSocket server for real-time data synchronization

When a user shares content from one device, it's immediately broadcasted to all other connected clients. When returning to the app after switching tabs or applications, a helpful dialog offers to copy text content to the clipboard for convenience.

## User Interface

The interface is divided into two main sections:
- **Share Content**: Enter and send text or upload images
- **Shared Content**: View the currently shared content across all connected devices

## Technical Details

### Frontend
- Built with React
- Uses a component-based architecture
- Real-time updates via WebSocket connection
- Uses the Clipboard API for copying text

### Backend
- Express.js server
- WebSocket for real-time communication
- In-memory content storage
- Cross-device synchronization

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```

## Usage

1. Open the application on multiple devices by navigating to the server address
2. Type text or upload an image on one device
3. Click "Share Text" or select an image to share
4. All connected devices will immediately see the shared content
5. When returning to the app, you'll be prompted to copy text content to clipboard

## Special Features

### Clipboard Integration
The app intelligently detects when you return to the page and offers to copy the currently shared text to your clipboard, making it easy to paste into other applications.

### Cross-Device Synchronization
Content is synchronized in real-time across all connected devices. Any changes made on one device are immediately reflected on all others.

## Browser Compatibility

The application works on all modern browsers that support:
- WebSockets
- Clipboard API
- ES6+ JavaScript features

## License

[MIT License](LICENSE)
