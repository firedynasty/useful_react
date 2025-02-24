// ContentReader.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Textarea } from './components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';

const ContentReader = () => {
  const [inputText, setInputText] = useState('');
  const [displayContent, setDisplayContent] = useState({ type: 'text', data: '' });
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [showCopied, setShowCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const wsRef = useRef(null);
  const copyTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const getWebSocketUrl = useCallback(async () => {
    try {
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
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionError('');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'sync') {
            setDisplayContent(data.content);
            setActiveTab(data.content.type);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setConnectionError('Connection lost. Attempting to reconnect...');
        setTimeout(connectWebSocket, 2000);
      };

      ws.onerror = (error) => {
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

  // Track latest content with a ref to always access current value
  const latestContentRef = useRef(displayContent);
  
  // Update ref when displayContent changes
  useEffect(() => {
    latestContentRef.current = displayContent;
  }, [displayContent]);

  // Handle visibility change events and window focus
  useEffect(() => {
    const checkForUpdatesAndShowDialog = async () => {
      try {
        // Wait a short delay to allow any pending updates to arrive
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Now check if we have text content to copy using the latest reference
        if (latestContentRef.current.type === 'text' && latestContentRef.current.data) {
          setShowCopyDialog(true);
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdatesAndShowDialog();
      }
    };

    const handleWindowFocus = () => {
      checkForUpdatesAndShowDialog();
    };

    // Add both visibility change and focus event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  const handleLoadContent = () => {
    if (!wsRef.current) return;
    
    if (activeTab === 'text' && !inputText.trim()) return;
    
    // Create the content to be shared
    const newContent = {
      type: activeTab,
      data: activeTab === 'text' ? inputText : displayContent.data
    };
    
    // Send update to server
    wsRef.current.send(JSON.stringify({
      type: 'update',
      contentType: activeTab,
      content: newContent.data
    }));
    
    // Also update local display content immediately
    // This ensures the sender also sees the update
    setDisplayContent(newContent);
    
    if (activeTab === 'text') {
      setInputText('');
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target?.result;
        if (base64Image && wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'update',
            contentType: 'image',
            content: base64Image
          }));
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleCopyToClipboard = async () => {
    if (displayContent.type !== 'text' || !displayContent.data) return;
    
    try {
      await navigator.clipboard.writeText(displayContent.data);
      setShowCopied(true);
      
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      
      copyTimeoutRef.current = setTimeout(() => {
        setShowCopied(false);
      }, 2000);
      
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleCopyDialogAction = (shouldCopy) => {
    setShowCopyDialog(false);
    if (shouldCopy) {
      handleCopyToClipboard();
    }
  };

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
          <CardTitle className="text-xs">Share Content</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-2 h-8">
              <TabsTrigger value="text" className="flex-1 text-xs">Text</TabsTrigger>
              <TabsTrigger value="image" className="flex-1 text-xs">Image</TabsTrigger>
            </TabsList>
            
            <TabsContent value="text">
              <Textarea
                placeholder="Type your text here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[150px] mb-2"
              />
              <Button 
                onClick={handleLoadContent}
                disabled={!inputText.trim() || !isConnected}
                className="w-full h-8 text-xs"
              >
                Share Text
              </Button>
            </TabsContent>
            
            <TabsContent value="image">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={!isConnected}
                className="w-full h-8 text-xs"
              >
                Select Image
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="flex-1">
        <CardHeader className="py-2">
          <CardTitle className="text-xs">Shared Content</CardTitle>
        </CardHeader>
        <CardContent className="p-2 flex flex-col gap-2">
          {displayContent.type === 'text' ? (
            <>
              <div className="whitespace-pre-wrap min-h-[150px] p-2 border rounded-md text-sm">
                {displayContent.data || 'No text shared yet'}
              </div>
              <div className="relative">
                <Button
                  onClick={handleCopyToClipboard}
                  disabled={!displayContent.data}
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
            </>
          ) : (
            <div className="min-h-[150px] flex items-center justify-center border rounded-md">
              {displayContent.data ? (
                <img 
                  src={displayContent.data} 
                  alt="Shared content" 
                  className="max-w-full max-h-[70vh] object-contain"
                />
              ) : (
                <div className="text-gray-500">No image shared yet</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Copy Confirmation Dialog */}
      {showCopyDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-md shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-medium mb-2">Copy to Clipboard</h3>
            <p className="mb-4">Do you want to copy the shared text to your clipboard?</p>
            <div className="flex justify-end space-x-2">
              <Button 
                onClick={() => handleCopyDialogAction(false)}
                variant="outline"
                className="bg-gray-200 hover:bg-gray-300"
              >
                No
              </Button>
              <Button 
                onClick={() => handleCopyDialogAction(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Yes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentReader;