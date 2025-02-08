import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronRight, ChevronLeft, Upload, ArrowRight, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const MediaReader = () => {
  const [files, setFiles] = useState({});
  const [currentTextFile, setCurrentTextFile] = useState('');
  const [currentImageFile, setCurrentImageFile] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const sortedFiles = useMemo(() => {
    const textFiles = [];
    const imageFiles = [];
    
    Object.entries(files).forEach(([filename, file]) => {
      if (file.type === 'text') {
        textFiles.push(filename);
      } else {
        imageFiles.push(filename);
      }
    });

    return {
      text: textFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
      images: imageFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    };
  }, [files]);

  const handleFileUpload = async (event) => {
    const fileList = event.target.files;
    const newFiles = { ...files };
    const fileReadPromises = [];

    Array.from(fileList).forEach(file => {
      if (file.type === 'text/plain') {
        const promise = new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            newFiles[file.name] = {
              type: 'text',
              content: e.target.result
            };
            resolve();
          };
          reader.readAsText(file);
        });
        fileReadPromises.push(promise);
      } 
      else if (file.type.startsWith('image/')) {
        const promise = new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            newFiles[file.name] = {
              type: 'image',
              content: [e.target.result]
            };
            resolve();
          };
          reader.readAsDataURL(file);
        });
        fileReadPromises.push(promise);
      }
    });

    await Promise.all(fileReadPromises);
    setFiles(newFiles);

    const textFiles = Object.entries(newFiles)
      .filter(([_, file]) => file.type === 'text')
      .map(([name]) => name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const imageFiles = Object.entries(newFiles)
      .filter(([_, file]) => file.type === 'image')
      .map(([name]) => name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (textFiles.length > 0 && !currentTextFile) {
      setCurrentTextFile(textFiles[0]);
      setCurrentPage(0);
    }

    if (imageFiles.length > 0 && !currentImageFile) {
      setCurrentImageFile(imageFiles[0]);
    }
  };

  const goToNextText = useCallback(() => {
    const currentIndex = sortedFiles.text.indexOf(currentTextFile);
    if (currentIndex === -1 || currentIndex === sortedFiles.text.length - 1) {
      setCurrentTextFile(sortedFiles.text[0]);
    } else {
      setCurrentTextFile(sortedFiles.text[currentIndex + 1]);
    }
    setCurrentPage(0);
  }, [currentTextFile, sortedFiles.text]);

  const goToPreviousText = useCallback(() => {
    const currentIndex = sortedFiles.text.indexOf(currentTextFile);
    if (currentIndex <= 0) {
      setCurrentTextFile(sortedFiles.text[sortedFiles.text.length - 1]);
    } else {
      setCurrentTextFile(sortedFiles.text[currentIndex - 1]);
    }
    setCurrentPage(0);
  }, [currentTextFile, sortedFiles.text]);

  const goToNextImage = useCallback(() => {
    const currentIndex = sortedFiles.images.indexOf(currentImageFile);
    if (currentIndex === -1 || currentIndex === sortedFiles.images.length - 1) {
      setCurrentImageFile(sortedFiles.images[0]);
    } else {
      setCurrentImageFile(sortedFiles.images[currentIndex + 1]);
    }
  }, [currentImageFile, sortedFiles.images]);

  const goToPreviousImage = useCallback(() => {
    const currentIndex = sortedFiles.images.indexOf(currentImageFile);
    if (currentIndex <= 0) {
      setCurrentImageFile(sortedFiles.images[sortedFiles.images.length - 1]);
    } else {
      setCurrentImageFile(sortedFiles.images[currentIndex - 1]);
    }
  }, [currentImageFile, sortedFiles.images]);

  const handleKeyPress = useCallback((event) => {
    if (Object.keys(files).length === 0) return;
    
    switch(event.key) {
      case 'ArrowRight':
        event.preventDefault();
        goToNextText();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        goToNextImage();
        break;
      default:
        break;
    }
  }, [files, goToNextText, goToNextImage]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <div className="h-screen flex flex-col">
      {/* File Upload */}
      <Card className="m-4">
        <CardContent className="p-6">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-500" />
              <p className="mb-2 text-sm text-gray-500">
                Click to upload files (hold Shift to select multiple)
              </p>
              <p className="text-xs text-gray-500">
                Supports .txt, .png, and .jpg files • Text: {sortedFiles.text.length} • Images: {sortedFiles.images.length}
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
        </CardContent>
      </Card>

      {/* Side-by-side Content Display */}
      <div className="flex-1 flex gap-4 px-4 pb-4 min-h-0">
        {/* Left Pane - Text Section */}
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle>Text Files</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            {sortedFiles.text.length > 0 ? (
              <>
                <div className="mb-4 flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={goToPreviousText}
                    disabled={!currentTextFile || sortedFiles.text.indexOf(currentTextFile) === 0}
                    size="icon"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  
                  <select 
                    value={currentTextFile}
                    onChange={(e) => {
                      setCurrentTextFile(e.target.value);
                      setCurrentPage(0);
                    }}
                    className="flex-grow p-2 border rounded-md"
                  >
                    {sortedFiles.text.map(fileName => (
                      <option key={fileName} value={fileName}>{fileName}</option>
                    ))}
                  </select>

                  <Button
                    variant="outline"
                    onClick={goToNextText}
                    disabled={!currentTextFile || sortedFiles.text.indexOf(currentTextFile) === sortedFiles.text.length - 1}
                    size="icon"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                {currentTextFile && (
                  <div className="prose max-w-none whitespace-pre-wrap overflow-y-auto flex-1">
                    {files[currentTextFile].content}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500">No text files uploaded</div>
            )}
          </CardContent>
        </Card>

        {/* Right Pane - Image Section */}
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle>Image Files</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            {sortedFiles.images.length > 0 ? (
              <>
                <div className="mb-4 flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={goToPreviousImage}
                    disabled={!currentImageFile || sortedFiles.images.indexOf(currentImageFile) === 0}
                    size="icon"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  
                  <select 
                    value={currentImageFile}
                    onChange={(e) => setCurrentImageFile(e.target.value)}
                    className="flex-grow p-2 border rounded-md"
                  >
                    {sortedFiles.images.map(fileName => (
                      <option key={fileName} value={fileName}>{fileName}</option>
                    ))}
                  </select>

                  <Button
                    variant="outline"
                    onClick={goToNextImage}
                    disabled={!currentImageFile || sortedFiles.images.indexOf(currentImageFile) === sortedFiles.images.length - 1}
                    size="icon"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                {currentImageFile && (
                  <div className="flex-1 flex items-center justify-center overflow-hidden">
                    <img 
                      src={files[currentImageFile].content[0]} 
                      alt={currentImageFile}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500">No image files uploaded</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MediaReader;