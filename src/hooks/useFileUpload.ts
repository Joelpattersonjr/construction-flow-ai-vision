import { useState } from 'react';
import { FileService, UploadFileParams, DocumentRecord } from '@/services/file';
import { useToast } from '@/hooks/use-toast';

interface UseFileUploadReturn {
  uploadFile: (params: UploadFileParams) => Promise<DocumentRecord | null>;
  isUploading: boolean;
  uploadProgress: number;
}

export const useFileUpload = (): UseFileUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadFile = async (params: UploadFileParams): Promise<DocumentRecord | null> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024;
      if (params.file.size > maxSize) {
        throw new Error('File size must be less than 10MB');
      }

      // Validate file type
      const allowedTypes = [
        'image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'application/zip', 'application/x-rar-compressed'
      ];

      if (!allowedTypes.includes(params.file.type) && params.file.type !== '') {
        console.warn('File type not in allowed list but proceeding:', params.file.type);
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 85));
      }, 200);

      console.log('Starting file upload:', params);
      
      const result = await FileService.uploadFile(params);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      toast({
        title: "File uploaded successfully",
        description: `${params.file.name} has been uploaded to ${params.category.replace('-', ' ')}`,
      });

      return result;
    } catch (error) {
      console.error('File upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000); // Keep progress visible briefly
    }
  };

  return {
    uploadFile,
    isUploading,
    uploadProgress,
  };
};