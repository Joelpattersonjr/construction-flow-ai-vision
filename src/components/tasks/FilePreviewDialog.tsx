import React, { useState, useEffect } from 'react';
import { Download, ExternalLink, X, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { taskFilesService, TaskFile } from '@/services/taskFilesService';

interface FilePreviewDialogProps {
  file: TaskFile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FilePreviewDialog: React.FC<FilePreviewDialogProps> = ({
  file,
  open,
  onOpenChange,
}) => {
  const [fileUrl, setFileUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (file && open) {
      loadFileUrl();
    }
  }, [file, open]);

  const loadFileUrl = async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      const url = await taskFilesService.getFileUrl(file.storage_path);
      setFileUrl(url);
    } catch (error) {
      toast({
        title: 'Error loading file',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!file) return;

    try {
      const blob = await taskFilesService.downloadFile(file.storage_path);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download started',
        description: `Downloading ${file.file_name}`,
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const resetView = () => {
    setZoom(100);
    setRotation(0);
  };

  const renderPreview = () => {
    if (!file || !fileUrl) return null;

    if (taskFilesService.isImageFile(file.file_type)) {
      return (
        <div className="flex items-center justify-center min-h-[400px] bg-muted/50 rounded-lg overflow-hidden">
          <img
            src={fileUrl}
            alt={file.file_name}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            }}
          />
        </div>
      );
    }

    if (taskFilesService.isPdfFile(file.file_type)) {
      return (
        <div className="h-[600px] w-full">
          <iframe
            src={fileUrl}
            className="w-full h-full border rounded-lg"
            title={file.file_name}
          />
        </div>
      );
    }

    if (file.file_type?.startsWith('text/')) {
      return (
        <div className="h-[400px] w-full">
          <iframe
            src={fileUrl}
            className="w-full h-full border rounded-lg bg-white"
            title={file.file_name}
          />
        </div>
      );
    }

    // For other file types, show download option
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
        <div className="text-6xl">{taskFilesService.getFileIcon(file.file_type)}</div>
        <div className="text-center">
          <h3 className="font-medium">{file.file_name}</h3>
          <p className="text-sm text-muted-foreground">
            Preview not available for this file type
          </p>
        </div>
        <Button onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download to View
        </Button>
      </div>
    );
  };

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="truncate">{file.file_name}</DialogTitle>
              <Badge variant="outline">
                {taskFilesService.formatFileSize(file.file_size)}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {taskFilesService.isImageFile(file.file_type) && (
                <>
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[40px] text-center">
                    {zoom}%
                  </span>
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRotate}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetView}>
                    Reset
                  </Button>
                </>
              )}
              
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
              
              {fileUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="text-center space-y-2">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-muted-foreground">Loading preview...</p>
              </div>
            </div>
          ) : (
            renderPreview()
          )}
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Uploaded by {file.uploader?.full_name || file.uploader?.email} •{' '}
              {new Date(file.uploaded_at).toLocaleDateString()}
            </div>
            <div>
              {file.file_type}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};