import React, { useState, useRef } from 'react';
import { Upload, File, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { taskFilesService } from '@/services/taskFilesService';

interface FileUploadDropzoneProps {
  taskId: number;
  onFileUploaded: (file: any) => void;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
}

export const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  taskId,
  onFileUploaded,
  maxSize = 50,
  acceptedTypes = [
    'image/*',
    'application/pdf',
    'text/*',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    // Check file type
    const isValidType = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.slice(0, -2);
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    if (!isValidType) {
      return 'File type not supported';
    }

    return null;
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validationError = validateFile(file);

    if (validationError) {
      toast({
        title: 'Invalid file',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedFile = await taskFilesService.uploadFile(
        taskId,
        file,
        (progress) => setUploadProgress(progress)
      );

      onFileUploaded(uploadedFile);
      toast({
        title: 'File uploaded successfully',
        description: `${file.name} has been uploaded`,
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  if (isUploading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 animate-pulse" />
              <span className="text-sm font-medium">Uploading...</span>
            </div>
            {uploadProgress !== null && (
              <Progress value={uploadProgress} className="w-full" />
            )}
            <p className="text-xs text-muted-foreground">
              {uploadProgress?.toFixed(0)}% complete
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileInputChange}
        accept={acceptedTypes.join(',')}
      />
      
      <Card
        className={`cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-primary bg-primary/5 border-dashed'
            : 'border-dashed border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className={`p-3 rounded-full ${isDragOver ? 'bg-primary/10' : 'bg-muted'}`}>
              <Upload className={`h-6 w-6 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">
                {isDragOver ? 'Drop your file here' : 'Upload a file'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isDragOver
                  ? 'Release to upload'
                  : 'Drag and drop or click to select a file'
                }
              </p>
              <p className="text-xs text-muted-foreground">
                Max size: {maxSize}MB • Supported: Images, PDFs, Documents
              </p>
            </div>

            {!isDragOver && (
              <Button variant="outline" size="sm">
                <File className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};