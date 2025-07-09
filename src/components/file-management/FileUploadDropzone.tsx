import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, File, X } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { FileCategory } from '@/services/fileService';

interface FileUploadDropzoneProps {
  projectId: string;
  category: FileCategory;
  currentPath: string;
  onUploadComplete: () => void;
}

const CATEGORY_OPTIONS: { value: FileCategory; label: string }[] = [
  { value: 'project-documents', label: 'Project Documents' },
  { value: 'project-photos', label: 'Project Photos' },
  { value: 'blueprints', label: 'Blueprints' },
  { value: 'site-photos', label: 'Site Photos' },
];

const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({ 
  projectId, 
  category,
  currentPath, 
  onUploadComplete 
}) => {
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const { uploadFile, isUploading, uploadProgress } = useFileUpload();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setPendingFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isUploading,
  });

  const removeFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    for (const file of pendingFiles) {
      const result = await uploadFile({
        file,
        projectId,
        category,
        folderPath: currentPath,
      });
      
      if (!result) break; // Stop if upload fails
    }
    
    setPendingFiles([]);
    onUploadComplete();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-gray-400'
            } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive
                ? 'Drop the files here...'
                : 'Drag & drop files here, or click to select files'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Support for images, PDFs, documents, and archives (max 10MB)
            </p>
          </div>
        </CardContent>
      </Card>

      {pendingFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">Files to upload:</h4>
            <div className="space-y-2">
              {pendingFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <File className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            {isUploading && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
            
            <div className="mt-4 flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setPendingFiles([])}
                disabled={isUploading}
              >
                Clear All
              </Button>
              <Button onClick={uploadFiles} disabled={isUploading}>
                Upload Files ({pendingFiles.length})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileUploadDropzone;