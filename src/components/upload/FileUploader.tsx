
import React, { useState, useRef } from "react";
import { Upload, FileAudio, FileImage, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FileUploaderProps {
  accept: string;
  maxSize: number; // in MB
  onFileSelected: (file: File) => void;
  selectedFile: File | null;
  fileType: "audio" | "image";
}

export function FileUploader({ 
  accept, 
  maxSize, 
  onFileSelected, 
  selectedFile,
  fileType
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [validationStatus, setValidationStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit`);
      return false;
    }

    // Enhanced audio format validation
    if (fileType === "audio") {
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      
      // Check for optimal formats
      if (fileName.endsWith('.mp3') || fileType.includes('mpeg')) {
        setValidationStatus('✅ MP3 format - optimal compatibility across all devices');
        setError(null);
        return true;
      } else if (fileName.endsWith('.wav') || fileType.includes('wav')) {
        setValidationStatus('✅ WAV format - excellent quality, good compatibility');
        setError(null);
        return true;
      } else if (fileName.endsWith('.m4a') || fileName.endsWith('.aac') || fileType.includes('aac')) {
        setValidationStatus('⚠️ AAC/M4A format - may not work on all browsers, consider converting to MP3');
        setError(null);
        return true;
      } else if (fileName.endsWith('.ogg') || fileType.includes('ogg')) {
        setValidationStatus('⚠️ OGG format - not supported on Safari/iOS, recommend MP3 instead');
        setError(null);
        return true;
      } else if (fileName.endsWith('.flac') || fileType.includes('flac')) {
        setValidationStatus('❌ FLAC format - not supported in browsers, please convert to MP3');
        setError('FLAC format is not supported in web browsers. Please convert to MP3 or WAV.');
        return false;
      } else if (fileType.includes('audio') || fileName.match(/\.(mp4|wma|amr)$/)) {
        setValidationStatus('⚠️ This audio format may not be compatible with all devices. MP3 is recommended.');
        setError(null);
        return true;
      } else {
        setValidationStatus(null);
        setError('Please upload a valid audio file (MP3, WAV recommended)');
        return false;
      }
    }

    setError(null);
    setValidationStatus(null);
    return true;
  };

  const convertAudioFile = async (file: File): Promise<File> => {
    if (fileType !== "audio") return file;
    
    // Check if file is already in optimal format
    const fileName = file.name.toLowerCase();
    const supportedFormats = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
    if (supportedFormats.includes(file.type) || fileName.endsWith('.mp3') || fileName.endsWith('.wav')) {
      console.log('File is already in compatible format:', file.type);
      return file;
    }
    
    setIsConverting(true);
    toast.info("Checking audio format compatibility...");
    
    try {
      const formData = new FormData();
      formData.append('audio_file', file);
      
      const { data: sessionData } = await supabase.auth.getSession();
      const authToken = sessionData.session?.access_token;
      
      const response = await fetch('https://qkpjlfcpncvvjyzfolag.supabase.co/functions/v1/audio-converter', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Format validation failed');
      }
      
      const convertedBuffer = await response.arrayBuffer();
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const convertedFile = new File([convertedBuffer], `${baseName}.mp3`, {
        type: 'audio/mpeg'
      });
      
      toast.success("Audio format validated and optimized!");
      setValidationStatus('✅ Audio optimized for maximum compatibility');
      return convertedFile;
    } catch (error) {
      console.error('Format validation error:', error);
      toast.error(`Format validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setIsConverting(false);
    }
  };

  const processFile = async (file: File) => {
    if (!validateFile(file)) return;
    
    try {
      const processedFile = await convertAudioFile(file);
      onFileSelected(processedFile);
    } catch (error) {
      console.error('File processing error:', error);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = () => {
    return fileType === "audio" ? <FileAudio className="h-10 w-10 text-muted-foreground" /> : <FileImage className="h-10 w-10 text-muted-foreground" />;
  };

  const getPlaceholderText = () => {
    return fileType === "audio" ? "Upload your track (MP3, WAV recommended)" : "Upload cover art (JPG or PNG)";
  };

  if (isConverting) {
    return (
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="mt-2 font-medium">Validating audio format...</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ensuring compatibility across all devices and browsers
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={fileType === "audio" ? "audio/*" : accept}
          className="hidden"
        />
        
        {selectedFile ? (
          <div className="flex flex-col items-center">
            {getFileIcon()}
            <p className="mt-2 font-medium break-all">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            {validationStatus && (
              <div className="flex items-center gap-2 mt-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-green-600">{validationStatus}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-base font-medium">{getPlaceholderText()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Drag & drop or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max size: {maxSize}MB
            </p>
            {fileType === "audio" && (
              <div className="mt-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-green-600">✅ Best compatibility: MP3, WAV</p>
                <p className="text-yellow-600">⚠️ Limited support: AAC, M4A, OGG</p>
                <p className="text-red-600">❌ Not supported: FLAC</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      {validationStatus && !selectedFile && (
        <div className="flex items-center gap-2 mt-2 text-sm">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-green-600">{validationStatus}</span>
        </div>
      )}
      
      {selectedFile && (
        <div className="mt-3 flex justify-center">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleButtonClick}
            disabled={isConverting}
          >
            Change file
          </Button>
        </div>
      )}
    </div>
  );
}
