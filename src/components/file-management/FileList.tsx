import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { File, Download, Trash2, Image, FileText, Archive } from 'lucide-react';
import { DocumentRecord, FileService, FileCategory } from '@/services/file';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface FileListProps {
  files: DocumentRecord[];
  onFileDeleted: () => void;
}

const getFileIcon = (fileType: string | null) => {
  if (!fileType) return <File className="h-4 w-4" />;
  
  if (fileType.startsWith('image/')) {
    return <Image className="h-4 w-4" />;
  }
  
  if (fileType === 'application/pdf' || fileType.includes('document')) {
    return <FileText className="h-4 w-4" />;
  }
  
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('archive')) {
    return <Archive className="h-4 w-4" />;
  }
  
  return <File className="h-4 w-4" />;
};

const getCategoryColor = (category: string | null) => {
  switch (category) {
    case 'project-documents':
      return 'bg-blue-100 text-blue-800';
    case 'project-photos':
      return 'bg-green-100 text-green-800';
    case 'blueprints':
      return 'bg-purple-100 text-purple-800';
    case 'site-photos':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatCategoryName = (category: string | null) => {
  if (!category) return 'Unknown';
  return category.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const FileList: React.FC<FileListProps> = ({ files, onFileDeleted }) => {
  const [downloadingFiles, setDownloadingFiles] = useState<Set<number>>(new Set());
  const [deletingFiles, setDeletingFiles] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const handleDownload = async (file: DocumentRecord) => {
    if (!file.storage_path || !file.category) return;
    
    setDownloadingFiles(prev => new Set(prev).add(file.id));
    
    try {
      const url = await FileService.getFileUrl(file.category as FileCategory, file.storage_path);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = file.file_name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download started",
        description: `${file.file_name} is downloading...`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download file",
        variant: "destructive",
      });
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  const handleDelete = async (file: DocumentRecord) => {
    if (!file.storage_path || !file.category) return;
    
    setDeletingFiles(prev => new Set(prev).add(file.id));
    
    try {
      await FileService.deleteFile(file.id, file.category as FileCategory, file.storage_path);
      
      toast({
        title: "File deleted",
        description: `${file.file_name} has been deleted successfully`,
      });
      
      onFileDeleted();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive",
      });
    } finally {
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  if (files.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <File className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No files</h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload your first file to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <File className="h-5 w-5" />
          <span>Project Files ({files.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="text-gray-500">
                  {getFileIcon(file.file_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.file_name}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getCategoryColor(file.category)}>
                      {formatCategoryName(file.category)}
                    </Badge>
                    {file.created_at && (
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(file)}
                  disabled={downloadingFiles.has(file.id)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deletingFiles.has(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete File</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{file.file_name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(file)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileList;