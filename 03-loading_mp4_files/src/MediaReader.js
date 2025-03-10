import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Upload, ArrowRight, ArrowLeft, Play, Pause, Volume2, VolumeX, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Slider } from './components/ui/slider';

// Use require.context to automatically import all files from default_files directory
const defaultFilesContext = require.context('./default_files', false, /\.(txt|jpg|jpeg|png|mp4)$/);
const DEFAULT_FILES = Object.fromEntries(
  defaultFilesContext.keys().map(key => {
    const filename = key.replace('./', '');
    const type = filename.endsWith('.txt') ? 'text' : 
                 filename.match(/\.(jpg|jpeg|png)$/i) ? 'image' : 'video';
    return [filename, { path: defaultFilesContext(key), type }];
  })
);

const MediaReader = () => {
  // State declarations
  const [isInitialized, setIsInitialized] = useState(false);
  const [files, setFiles] = useState({});
  const [currentTextFile, setCurrentTextFile] = useState('');
  const [currentMediaFile, setCurrentMediaFile] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef(null);

  // Sorted files memo
  const sortedFiles = useMemo(() => {
    const textFiles = [];
    const mediaFiles = [];
    
    Object.entries(files).forEach(([filename, file]) => {
      if (file.type === 'text') {
        textFiles.push(filename);
      } else {
        mediaFiles.push(filename);
      }
    });

    return {
      text: textFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
      media: mediaFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    };
  }, [files]);

  // Navigation functions
  const goToNextMedia = useCallback(() => {
    const currentIndex = sortedFiles.media.indexOf(currentMediaFile);
    if (currentIndex === -1 || currentIndex === sortedFiles.media.length - 1) {
      setCurrentMediaFile(sortedFiles.media[0]);
    } else {
      setCurrentMediaFile(sortedFiles.media[currentIndex + 1]);
    }
    setIsPlaying(false);
  }, [currentMediaFile, sortedFiles.media]);

  const goToPreviousMedia = useCallback(() => {
    const currentIndex = sortedFiles.media.indexOf(currentMediaFile);
    if (currentIndex <= 0) {
      setCurrentMediaFile(sortedFiles.media[sortedFiles.media.length - 1]);
    } else {
      setCurrentMediaFile(sortedFiles.media[currentIndex - 1]);
    }
    setIsPlaying(false);
  }, [currentMediaFile, sortedFiles.media]);

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

  // Video control functions
  const handleVideoTimeUpdate = (e) => {
    setCurrentTime(e.target.currentTime);
  };

  const handleVideoDurationChange = (e) => {
    setDuration(e.target.duration);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (value) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // File handling functions
  const loadDefaultFiles = async () => {
    try {
      const newFiles = {};

      for (const [filename, fileInfo] of Object.entries(DEFAULT_FILES)) {
        const response = await fetch(fileInfo.path);
        const blob = await response.blob();
        
        if (fileInfo.type === 'text') {
          const text = await blob.text();
          newFiles[filename] = {
            type: 'text',
            content: text
          };
        } else if (fileInfo.type === 'image') {
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          newFiles[filename] = {
            type: 'image',
            content: [dataUrl]
          };
        } else if (fileInfo.type === 'video') {
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          newFiles[filename] = {
            type: 'video',
            content: [dataUrl]
          };
        }
      }

      setFiles(newFiles);

      const textFiles = Object.entries(newFiles)
        .filter(([_, file]) => file.type === 'text')
        .map(([name]) => name)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

      const mediaFiles = Object.entries(newFiles)
        .filter(([_, file]) => file.type === 'image' || file.type === 'video')
        .map(([name]) => name)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

      if (textFiles.length > 0) {
        setCurrentTextFile(textFiles[0]);
      }

      if (mediaFiles.length > 0) {
        setCurrentMediaFile(mediaFiles[0]);
      }
    } catch (error) {
      console.error('Error loading default files:', error);
    } finally {
      setIsInitialized(true);
    }
  };

  const resetState = () => {
    setFiles({});
    setCurrentTextFile('');
    setCurrentMediaFile('');
    setIsPlaying(false);
    setIsMuted(false);
    setDuration(0);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.src = '';
    }
  };

  const handleFileUpload = async (event) => {
    const fileList = event.target.files;
    if (!fileList.length) return;
    
    const newFiles = { ...files }; // Preserve existing files
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
      else if (file.type.startsWith('image/') || file.type === 'video/mp4') {
        const promise = new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            newFiles[file.name] = {
              type: file.type.startsWith('image/') ? 'image' : 'video',
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

    const mediaFiles = Object.entries(newFiles)
      .filter(([_, file]) => file.type === 'image' || file.type === 'video')
      .map(([name]) => name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (!currentTextFile && textFiles.length > 0) {
      setCurrentTextFile(textFiles[0]);
    }

    if (!currentMediaFile && mediaFiles.length > 0) {
      setCurrentMediaFile(mediaFiles[0]);
    }
  };

  const handleClearFiles = () => {
    resetState();
    setIsInitialized(false);
  };

  // Keyboard handler
  const handleKeyPress = useCallback((event) => {
    if (Object.keys(files).length === 0) return;
    
    switch(event.key) {
      case 'ArrowRight':
        event.preventDefault();
        goToNextText();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        goToPreviousText();
        break;
      case 'ArrowDown':
        event.preventDefault();
        goToNextMedia();
        break;
      case 'ArrowUp':
        event.preventDefault();
        goToPreviousMedia();
        break;
      case ' ':  // Spacebar
        event.preventDefault();  // Prevent page scroll
        if (files[currentMediaFile]?.type === 'video') {
          togglePlay();
        }
        break;
      default:
        break;
    }
  }, [files, goToNextText, goToPreviousText, goToNextMedia, goToPreviousMedia, currentMediaFile, togglePlay]);

  // Effects
  useEffect(() => {
    if (!isInitialized) {
      loadDefaultFiles();
    }
  }, [isInitialized]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-end p-1 gap-2 text-xs text-gray-500">
        <span className="text-[10px]">←→ text | ↑↓ media | space play</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-gray-100 rounded-full"
          onClick={handleClearFiles}
        >
          <Trash2 className="w-5 h-5 text-gray-500" />
        </Button>
        <label className="cursor-pointer hover:bg-gray-100 p-1 rounded-full">
          <Upload className="w-5 h-5 text-gray-500" />
          <input 
            type="file" 
            accept=".txt,.png,.jpg,.jpeg,.mp4"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
      </div>

  
      <div className="flex-1 flex flex-col md:flex-row gap-4 px-4 pb-4 min-h-0">
        {/* Media Files Card - Now First */}
        <Card className="flex-1 flex flex-col min-h-[50vh] md:min-h-0">
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex justify-between items-center">
              Media Files
              <span className="text-xs text-gray-500">{sortedFiles.media.length} files</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 p-2">
            {sortedFiles.media.length > 0 ? (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={goToPreviousMedia}
                    disabled={!currentMediaFile || sortedFiles.media.indexOf(currentMediaFile) === 0}
                    size="icon"
                    className="h-8 w-8"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  
                  <select 
                    value={currentMediaFile}
                    onChange={(e) => {
                      setCurrentMediaFile(e.target.value);
                      setIsPlaying(false);
                    }}
                    className="flex-grow p-1 text-sm border rounded-md"
                  >
                    {sortedFiles.media.map(fileName => (
                      <option key={fileName} value={fileName}>{fileName}</option>
                    ))}
                  </select>

                  <Button
                    variant="outline"
                    onClick={goToNextMedia}
                    disabled={!currentMediaFile || sortedFiles.media.indexOf(currentMediaFile) === sortedFiles.media.length - 1}
                    size="icon"
                    className="h-8 w-8"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                {currentMediaFile && (
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1 flex items-center justify-center overflow-hidden">
                      {files[currentMediaFile].type === 'image' ? (
                        <img 
                          src={files[currentMediaFile].content[0]} 
                          alt={currentMediaFile}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <video
                          ref={videoRef}
                          src={files[currentMediaFile].content[0]}
                          className="max-w-full max-h-full"
                          onTimeUpdate={handleVideoTimeUpdate}
                          onDurationChange={handleVideoDurationChange}
                          onEnded={handleVideoEnded}
                        />
                      )}
                    </div>
                    
                    {files[currentMediaFile]?.type === 'video' && (
                      <div className="mt-2 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={togglePlay}
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <div className="flex-1">
                            <Slider
                              value={[currentTime]}
                              max={duration}
                              step={0.1}
                              onValueChange={(value) => handleSeek(value[0])}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={toggleMute}
                          >
                            {isMuted ? (
                              <VolumeX className="w-4 h-4" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <div className="text-xs text-gray-500 text-center">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 text-sm">No media files uploaded</div>
            )}
          </CardContent>
        </Card>

        {/* Text Files Card - Now Second */}
        <Card className="flex-1 flex flex-col min-h-[50vh] md:min-h-0">
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex justify-between items-center">
              Text Files
              <span className="text-xs text-gray-500">{sortedFiles.text.length} files</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 p-2">
            {sortedFiles.text.length > 0 ? (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={goToPreviousText}
                    disabled={!currentTextFile || sortedFiles.text.indexOf(currentTextFile) === 0}
                    size="icon"
                    className="h-8 w-8"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  
                  <select 
                    value={currentTextFile}
                    onChange={(e) => {
                      setCurrentTextFile(e.target.value);
                      setCurrentPage(0);
                    }}
                    className="flex-grow p-1 text-sm border rounded-md"
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
                    className="h-8 w-8"
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
              <div className="text-center text-gray-500 text-sm">No text files uploaded</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MediaReader;