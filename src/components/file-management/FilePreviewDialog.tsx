import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, Eye, FileText, Image } from 'lucide-react';
import { FileService, FileItem } from '@/services/file';
import { useToast } from '@/hooks/use-toast';

interface FilePreviewDialogProps {
  file: FileItem | null;
  open: boolean;
  onClose: () => void;
  projectId: string;
}

const FilePreviewDialog: React.FC<FilePreviewDialogProps> = ({
  file,
  open,
  onClose,
  projectId
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (file && open) {
      loadPreview();
    } else {
      setPreviewUrl(null);
    }
  }, [file, open]);

  const loadPreview = async () => {
    if (!file || !file.category || !file.storage_path) return;

    setLoading(true);
    try {
      const url = await FileService.getFileUrl(
        file.category, 
        file.storage_path,
        projectId,
        file.file_name
      );
      setPreviewUrl(url);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load file preview",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!previewUrl || !file) return;

    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const isImage = file?.file_type?.startsWith('image/');
  const isText = file?.file_type?.startsWith('text/') || file?.file_type === 'application/json';
  const isPdf = file?.file_type === 'application/pdf';

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{file.file_name}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : previewUrl ? (
            <div className="space-y-4">
              {isImage && (
                <div className="text-center">
                  <img 
                    src={previewUrl} 
                    alt={file.file_name} 
                    className="max-w-full max-h-[60vh] object-contain mx-auto"
                  />
                </div>
              )}

              {isPdf && (
                <div className="h-[60vh]">
                  <iframe
                    src={previewUrl}
                    className="w-full h-full border rounded"
                    title="PDF Preview"
                  />
                </div>
              )}

              {isText && (
                <div className="border rounded p-4 bg-gray-50 max-h-[60vh] overflow-auto">
                  <iframe
                    src={previewUrl}
                    className="w-full h-full border-none"
                    title="Text Preview"
                  />
                </div>
              )}

              {!isImage && !isPdf && !isText && (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Preview not available for this file type</p>
                  <p className="text-sm text-gray-500 mt-2">
                    File type: {file.file_type}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Eye className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Unable to load preview</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewDialog;