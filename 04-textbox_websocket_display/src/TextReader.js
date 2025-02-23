
// TextReader.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Textarea } from './components/ui/textarea';

const TextReader = () => {
  const [inputText, setInputText] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [showCopied, setShowCopied] = useState(false);
  const wsRef = useRef(null);
  const copyTimeoutRef = useRef(null);

  const getWebSocketUrl = useCallback(async () => {
    try {
      // Get the current hostname (works for both localhost and IP address)
      const hostname = window.location.hostname;
      const response = await fetch(`http://${hostname}:3001/api/server-info`);
      const data = await response.json();
      return `ws://${hostname}:${data.wsPort}`;
    } catch (error) {
      console.error('Failed to get WebSocket URL:', error);
      throw error;
    }
  }, []);

  const connectWebSocket = useCallback(async () => {
    try {
      const wsUrl = await getWebSocketUrl();
      console.log('Connecting to WebSocket at:', wsUrl);
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connected to WebSocket');
        setIsConnected(true);
        setConnectionError('');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'sync') {
            setDisplayText(data.text);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from WebSocket');
        setIsConnected(false);
        setConnectionError('Connection lost. Attempting to reconnect...');
        // Attempt to reconnect after 2 seconds
        setTimeout(connectWebSocket, 2000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Failed to connect to server. Retrying...');
        ws.close();
      };

      wsRef.current = ws;
    } catch (error) {
      setConnectionError('Failed to connect to server. Retrying...');
      setTimeout(connectWebSocket, 2000);
    }
  }, [getWebSocketUrl]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  const handleLoadText = () => {
    if (!inputText.trim() || !wsRef.current) return;
    
    // Send update to server
    wsRef.current.send(JSON.stringify({
      type: 'update',
      text: inputText
    }));
    
    setDisplayText(inputText);
    setInputText(''); // Clear input after loading
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(displayText);
      setShowCopied(true);
      
      // Clear any existing timeout
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      
      // Hide the notification after 2 seconds
      copyTimeoutRef.current = setTimeout(() => {
        setShowCopied(false);
      }, 2000);
      
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="h-screen flex flex-col gap-4 p-4">
      <div className="text-sm text-right">
        Status: {isConnected ? (
          <span className="text-green-600">Connected</span>
        ) : (
          <span className="text-red-600">{connectionError || 'Disconnected'}</span>
        )}
      </div>
      
      <Card className="flex-1">
        <CardHeader className="py-2">
          <CardTitle className="text-sm">Enter Text</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Textarea
            placeholder="Type your text here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 min-h-[150px]"
          />
          <Button 
            onClick={handleLoadText}
            disabled={!inputText.trim() || !isConnected}
            className="w-full"
          >
            Load Text
          </Button>
        </CardContent>
      </Card>

      <Card className="flex-1">
        <CardHeader className="py-2">
          <CardTitle className="text-sm">Loaded Text</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="whitespace-pre-wrap min-h-[150px] p-2 border rounded-md">
            {displayText || 'No text loaded yet'}
          </div>
          <div className="relative">
            <Button
              onClick={handleCopyToClipboard}
              disabled={!displayText}
              className="w-full"
            >
              {showCopied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
            
            {showCopied && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-green-100 text-green-800 rounded-md shadow-md transition-opacity duration-200 text-center">
                Text copied to clipboard!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TextReader;