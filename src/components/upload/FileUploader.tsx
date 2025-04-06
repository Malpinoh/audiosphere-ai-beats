
import React, { useState, useRef } from "react";
import { Upload, FileAudio, FileImage, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const acceptedTypes = accept.split(',').map(type => 
      type.trim().replace('.', '').toLowerCase()
    );
    
    if (!fileExtension || !acceptedTypes.includes(fileExtension)) {
      setError(`Invalid file type. Accepted types: ${accept}`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = () => {
    return fileType === "audio" ? <FileAudio className="h-10 w-10 text-muted-foreground" /> : <FileImage className="h-10 w-10 text-muted-foreground" />;
  };

  const getPlaceholderText = () => {
    return fileType === "audio" ? "Upload your track (MP3 or WAV)" : "Upload cover art (JPG or PNG)";
  };

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
          accept={accept}
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
          >
            Change file
          </Button>
        </div>
      )}
    </div>
  );
}
