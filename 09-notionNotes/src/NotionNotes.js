// NotionNotes.js
import React, { useState, useEffect, useRef } from 'react';
import { Book, MessageSquare, Send, FileText, RefreshCw } from 'lucide-react';

// Main component
const NotionNotes = () => {
  const [templates, setTemplates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState({});
  
  // Add a ref for the content container
  const contentRef = useRef(null);
  
  // Load templates data from JSON file
  useEffect(() => {
    const loadTemplatesData = async () => {
      try {
        setLoading(true);
        // Use standard fetch API to load the templates.json
        const response = await fetch('/templates.json');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setTemplates(data);
        
        // Initialize notes from templates
        const initialNotes = {};
        Object.entries(data).forEach(([key, template]) => {
          if (template.notes) {
            initialNotes[key] = template.notes;
          }
        });
        setNotes(initialNotes);
        
        // Default to first template
        if (data && Object.keys(data).length > 0) {
          const firstKey = Object.keys(data)[0];
          setSelectedTemplate(data[firstKey]);
          setSelectedSection(firstKey);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Failed to load templates data:", err);
        setError(`Failed to load templates data. Please try again later.`);
        setLoading(false);
      }
    };
    
    loadTemplatesData();
  }, []);

  // Handle section selection
  const handleSectionSelect = (sectionKey) => {
    if (templates) {
      setSelectedTemplate(templates[sectionKey]);
      setSelectedSection(sectionKey);
      
      // Scroll to top when section changes
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  };
  
  // Handle saving notes to the server
  const handleSaveNotes = async () => {
    if (!selectedSection) return;
    
    try {
      const noteContent = document.querySelector('.content-notes').value;
      
      // Create updated template data
      const updatedTemplates = { ...templates };
      updatedTemplates[selectedSection].notes = noteContent;
      
      // Call the server to save the updated templates
      const response = await fetch('http://localhost:3001/api/save-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templates: updatedTemplates }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        // Show success indicator (could use a toast notification here)
        alert('Notes saved successfully!');
      } else {
        throw new Error(data.error || 'Failed to save notes');
      }
    } catch (error) {
      console.error("Error saving notes:", error);
      alert(`Error: ${error.message || "Failed to save notes. Please try again later."}`);
    }
  };
  
  // Parse content for links and text
  const parseContent = (content) => {
    const lines = content.split('\n');
    const sections = [];
    let currentSection = {
      type: null,
      content: []
    };

    lines.forEach(line => {
      const trimmedLine = line;  // Keep original spacing
      
      if (trimmedLine.includes(',') && trimmedLine.trim().startsWith('http')) {
        if (currentSection.type === 'text' && currentSection.content.length > 0) {
          sections.push({ ...currentSection });
          currentSection = { type: null, content: [] };
        }

        const [url, title] = trimmedLine.split(',').map(part => part.trim());
        if (currentSection.type !== 'links') {
          currentSection = { type: 'links', content: [] };
        }
        currentSection.content.push({ url, title });
      } else {
        if (currentSection.type === 'links' && currentSection.content.length > 0) {
          sections.push({ ...currentSection });
          currentSection = { type: null, content: [] };
        }

        if (currentSection.type !== 'text') {
          currentSection = { type: 'text', content: [] };
        }
        currentSection.content.push(trimmedLine);
      }
    });

    if (currentSection.content.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  };
  
  // Handle notes change
  const handleNotesChange = (e) => {
    const updatedNotes = {
      ...notes,
      [selectedSection]: e.target.value
    };
    setNotes(updatedNotes);
  };
  
  // Get current context (section and notes)
  const getCurrentContext = () => {
    if (!selectedTemplate) return "";
    
    const sectionName = selectedTemplate.title;
    const currentNotes = notes[selectedSection] || "";
    return `Current section: ${sectionName}\n\nNotes content:\n${currentNotes}`;
  };
  
  // Handle user input submission
  const handleSubmit = async () => {
    if (!userInput.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setOutputText("Processing your question...");
    
    try {
      // Add context about the current selection and notes
      const context = getCurrentContext();
      
      // Include previous response if it exists
      let previousResponse = "";
      if (outputText && outputText !== "Processing your question..." && !outputText.startsWith("Error:")) {
        previousResponse = `\n\nPrevious response: ${outputText}`;
      }
      
      const fullPrompt = `Context: I'm viewing a section titled "${selectedTemplate?.title}".${previousResponse}\n\nMy notes are as follows:\n${notes[selectedSection] || "No notes yet."}\n\nQuestion: ${userInput}`;
      
      // Important: Use the full URL with port for the server
      const response = await fetch('http://localhost:3001/api/ask-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: fullPrompt }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setOutputText(data.reply);
      setUserInput(''); // Clear the input after sending
    } catch (error) {
      console.error("Error querying Ollama:", error);
      setOutputText(`Error: ${error.message || "Failed to get response from Ollama. Please try again later."}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle keyboard events in the textarea
  const handleKeyDown = (e) => {
    // If Enter is pressed without Shift, submit the form
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default behavior (newline)
      handleSubmit();
    }
    // If Shift+Enter is pressed, allow default behavior (newline)
  };

  // If still loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4">Loading Templates Data...</div>
          <div className="animate-pulse bg-blue-500 h-2 w-64 rounded"></div>
        </div>
      </div>
    );
  }
  
  // If there was an error
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-100">
        <div className="text-center text-red-600">
          <div className="text-2xl font-bold mb-4">Error</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  // Generate sorted entries for sidebar
  const sortedEntries = templates 
    ? Object.entries(templates).sort((a, b) => a[1].title.localeCompare(b[1].title)) 
    : [];

  // Main render
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Section Selection Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold flex items-center">
            <Book className="mr-2 h-5 w-5" />
            Sections
          </h2>
        </div>
        <div className="overflow-y-auto h-full">
          {sortedEntries.map(([key, template]) => (
            <button
              key={key}
              onClick={() => handleSectionSelect(key)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                selectedSection === key ? 'bg-blue-100 font-medium' : ''
              }`}
            >
              {template.title}
            </button>
          ))}
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar with Section Title */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">
                {selectedTemplate ? selectedTemplate.title : 'Select a Section'}
              </h1>
            </div>
            
            {/* Additional controls could go here */}
            <div className="flex items-center mt-2 sm:mt-0">
              <div className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-blue-600" />
                <span className="mr-2">Notes</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content and AI Interaction Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Content Display */}
          <div ref={contentRef} className="flex-1 overflow-y-auto p-6 bg-white">
            {selectedTemplate && (
              <div>
                <h2 className="text-xl mr-2 font-semibold mb-4">
                  {selectedTemplate.title}
                </h2>
                
                {/* Parsed content display */}
                {parseContent(selectedTemplate.content).map((section, idx) => (
                  <div key={idx}>
                    {section.type === 'links' && (
                      <div className="link-list mb-4">
                        {section.content.map((link, linkIdx) => (
                          <a 
                            key={linkIdx} 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block p-2 mb-2 bg-gray-50 hover:bg-gray-100 rounded text-blue-600"
                          >
                            {link.title}
                          </a>
                        ))}
                      </div>
                    )}
                    
                    {section.type === 'text' && (
                      <div className="text-content mb-4 bg-gray-50 p-4 rounded">
                        <pre className="whitespace-pre-wrap font-mono text-sm">
                          {section.content.join('\n')}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Notes editable section with save button */}
                <div className="mt-8 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Your Notes</h3>
                    <button
                      onClick={handleSaveNotes}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h-2v5.586l-1.293-1.293z" />
                        <path d="M5 4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1H5zm-2 1a3 3 0 013-3h10a3 3 0 013 3v10a3 3 0 01-3 3H6a3 3 0 01-3-3V5z" />
                      </svg>
                      Save
                    </button>
                  </div>
                  <textarea
                    className="content-notes w-full min-h-60 p-4 border border-gray-300 rounded bg-gray-50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={notes[selectedSection] || ''}
                    onChange={handleNotesChange}
                    placeholder="Add your notes here..."
                    data-section={selectedSection}
                    rows="15"
                    style={{ height: "70vh" }}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* AI Interaction Panel */}
          <div className="w-96 border-l border-gray-200 bg-gray-50 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Ask About Notes
              </h2>
              <button
                onClick={() => setOutputText('')}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-1" /> Reset
              </button>
            </div>
            
            {/* Output Display */}
            <div className="flex-1 p-4 overflow-y-auto bg-white">
              {outputText ? (
                <div className={`whitespace-pre-wrap ${isProcessing ? 'animate-pulse' : ''}`}>
                  {outputText}
                </div>
              ) : (
                <div className="text-gray-500 italic">
                  Ask a question about your notes to see the response here.
                </div>
              )}
            </div>
            
            {/* Input Area */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-start">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your question here... (Press Enter to send, Shift+Enter for new line)"
                  className="flex-1 border border-gray-300 rounded-l px-3 py-2 min-h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isProcessing}
                />
                <button
                  onClick={handleSubmit}
                  className={`bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 transition-colors h-24 flex items-center justify-center ${
                    isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={isProcessing}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotionNotes;