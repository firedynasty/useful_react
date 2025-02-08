import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronRight, ChevronLeft, Upload, ArrowRight, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const MediaReader = () => {
  const [files, setFiles] = useState({});
  const [currentFileName, setCurrentFileName] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const sortedFileNames = useMemo(() => {
    return Object.keys(files).sort((a, b) => 
      a.localeCompare(b, undefined, { numeric: true })
    );
  }, [files]);

  const handleFileUpload = (event) => {
    const fileList = event.target.files;
    const newFiles = { ...files };

    Array.from(fileList).forEach(file => {
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          const pageSize = 500;
          const textPages = [];
          
          for (let i = 0; i < content.length; i += pageSize) {
            let endIndex = content.indexOf('.', i + pageSize);
            if (endIndex === -1) endIndex = content.length;
            textPages.push(content.slice(i, endIndex + 1).trim());
          }
          
          newFiles[file.name] = {
            type: 'text',
            content: textPages
          };
          setFiles(newFiles);
          
          if (!currentFileName) {
            setCurrentFileName(file.name);
            setCurrentPage(0);
          }
        };
        reader.readAsText(file);
      } 
      else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newFiles[file.name] = {
            type: 'image',
            content: [e.target.result]
          };
          setFiles(newFiles);
          
          if (!currentFileName) {
            setCurrentFileName(file.name);
            setCurrentPage(0);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const goToNextFile = useCallback(() => {
    const currentIndex = sortedFileNames.indexOf(currentFileName);
    if (currentIndex < sortedFileNames.length - 1) {
      setCurrentFileName(sortedFileNames[currentIndex + 1]);
      setCurrentPage(0);
    }
  }, [currentFileName, sortedFileNames]);

  const goToPreviousFile = useCallback(() => {
    const currentIndex = sortedFileNames.indexOf(currentFileName);
    if (currentIndex > 0) {
      setCurrentFileName(sortedFileNames[currentIndex - 1]);
      setCurrentPage(0);
    }
  }, [currentFileName, sortedFileNames]);

  const handleKeyPress = useCallback((event) => {
    // Only handle key events if files are loaded
    if (Object.keys(files).length === 0) return;
    
    switch(event.key) {
      case 'ArrowRight':
        event.preventDefault();
        goToNextFile();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        goToPreviousFile();
        break;
      default:
        break;
    }
  }, [files, goToNextFile, goToPreviousFile]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const goToNextPage = () => {
    const currentFile = files[currentFileName];
    if (currentFile && currentPage < currentFile.content.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentFileName && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const switchFile = (fileName) => {
    setCurrentFileName(fileName);
    setCurrentPage(0);
  };

  const renderContent = () => {
    if (!currentFileName) {
      return (
        <div className="text-center text-gray-500">
          Upload .txt, .png, or .jpg files to start viewing
        </div>
      );
    }

    const currentFile = files[currentFileName];
    if (currentFile.type === 'text') {
      return (
        <div className="prose max-w-none">
          {currentFile.content[currentPage]}
        </div>
      );
    } else {
      return (
        <div className="flex justify-center">
          <img 
            src={currentFile.content[0]} 
            alt={currentFileName}
            className="max-h-96 object-contain"
          />
        </div>
      );
    }
  };

  const currentFileIndex = sortedFileNames.indexOf(currentFileName);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="bg-white shadow-lg">
        <CardContent className="p-6">
          {/* File upload */}
          <div className="mb-6">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500">
                  Click to upload files (hold Shift to select multiple)
                </p>
                <p className="text-xs text-gray-500">
                  Supports .txt, .png, and .jpg files • {Object.keys(files).length} files loaded
                </p>
              </div>
              <input 
                type="file" 
                accept=".txt,.png,.jpg,.jpeg"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* File selector with navigation */}
          {Object.keys(files).length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <Button
                variant="outline"
                onClick={goToPreviousFile}
                disabled={currentFileIndex === 0}
                size="icon"
                className="flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              
              <select 
                value={currentFileName}
                onChange={(e) => switchFile(e.target.value)}
                className="flex-grow p-2 border rounded-md"
              >
                {sortedFileNames.map(fileName => (
                  <option key={fileName} value={fileName}>
                    {fileName} ({files[fileName].type})
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                onClick={goToNextFile}
                disabled={currentFileIndex === sortedFileNames.length - 1}
                size="icon"
                className="flex-shrink-0"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Content display */}
          <div className="min-h-48 mb-6">
            {renderContent()}
          </div>

          {/* Page navigation controls - only show for text files with multiple pages */}
          {currentFileName && 
           files[currentFileName].type === 'text' && 
           files[currentFileName].content.length > 1 && (
            <div className="flex justify-between items-center">
              <Button 
                variant="outline"
                onClick={goToPreviousPage}
                disabled={currentPage === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <span className="text-sm text-gray-500">
                Page {currentPage + 1} of {files[currentFileName].content.length}
              </span>

              <Button 
                variant="outline"
                onClick={goToNextPage}
                disabled={currentPage === files[currentFileName].content.length - 1}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MediaReader;