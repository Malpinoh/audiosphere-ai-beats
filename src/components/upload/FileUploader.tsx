
import React, { useState, useRef } from "react";
import { Upload, FileAudio, FileImage, AlertCircle, Loader2 } from "lucide-react";
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

    setError(null);
    return true;
  };

  const convertAudioFile = async (file: File): Promise<File> => {
    if (fileType !== "audio") return file;
    
    // Check if file is already in supported format
    const supportedFormats = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
    if (supportedFormats.includes(file.type)) {
      return file;
    }
    
    setIsConverting(true);
    toast.info("Converting audio to supported format...");
    
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
        throw new Error(errorData.error || 'Conversion failed');
      }
      
      const convertedBuffer = await response.arrayBuffer();
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const convertedFile = new File([convertedBuffer], `${baseName}.mp3`, {
        type: 'audio/mpeg'
      });
      
      toast.success("Audio converted successfully!");
      return convertedFile;
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    return fileType === "audio" ? "Upload your track (Any audio format)" : "Upload cover art (JPG or PNG)";
  };

  if (isConverting) {
    return (
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="mt-2 font-medium">Converting audio file...</p>
          <p className="text-sm text-muted-foreground mt-1">
            Please wait while we convert your audio to a supported format
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
              <p className="text-xs text-muted-foreground mt-1">
                Supports: MP3, WAV, AAC, FLAC, OGG (auto-converted)
              </p>
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
