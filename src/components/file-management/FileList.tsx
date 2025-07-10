import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { File, Download, Trash2, Image, FileText, Archive, Crown } from 'lucide-react';
import { DocumentRecord, FileService, FileCategory } from '@/services/file';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { FileEditDialog } from './FileEditDialog';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeDialog } from '@/components/subscription/UpgradeDialog';

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

const isTextFile = (fileType: string | null): boolean => {
  if (!fileType) return false;
  const textTypes = [
    'text/plain',
    'text/markdown',
    'application/json',
    'text/csv',
    'text/xml',
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
  ];
  return textTypes.includes(fileType) || fileType.startsWith('text/');
};

const FileList: React.FC<FileListProps> = ({ files, onFileDeleted }) => {
  const [deletingFile, setDeletingFile] = useState<number | null>(null);
  const [editFile, setEditFile] = useState<DocumentRecord | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { toast } = useToast();
  const { isFeatureEnabled } = useSubscription();

  const handleDownload = async (file: DocumentRecord) => {
    try {
      if (!file.storage_path || !file.category) {
        throw new Error('File path or category is missing');
      }
      
      const url = await FileService.getFileUrl(file.category as FileCategory, file.storage_path);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.file_name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (file: DocumentRecord) => {
    const hasCollaboration = isFeatureEnabled('collaboration');
    
    if (!hasCollaboration) {
      setShowUpgradeDialog(true);
      return;
    }
    
    setEditFile(file);
  };

  const handleDelete = async (file: DocumentRecord) => {
    if (!file.storage_path || !file.category) {
      toast({
        title: "Delete failed",
        description: "File information is incomplete",
        variant: "destructive",
      });
      return;
    }

    setDeletingFile(file.id);
    try {
      await FileService.deleteFile(file.id, file.category as FileCategory, file.storage_path);
      toast({
        title: "File deleted",
        description: `"${file.file_name}" has been deleted successfully`,
      });
      onFileDeleted();
    } catch (error) {
      toast({
        title: "Failed to delete file",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setDeletingFile(null);
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
    <>
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
                  {isTextFile(file.file_type) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(file)}
                    >
                      Edit
                      {!isFeatureEnabled('collaboration') && <Crown className="h-3 w-3 ml-1" />}
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
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
                          disabled={deletingFile === file.id}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deletingFile === file.id ? 'Deleting...' : 'Delete'}
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

      <FileEditDialog
        documentId={editFile?.id?.toString() || null}
        fileName={editFile?.file_name || ''}
        isOpen={!!editFile}
        onClose={() => setEditFile(null)}
      />

      <UpgradeDialog
        isOpen={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        feature="Real-time collaborative editing"
        title="Upgrade to Edit Files"
        description="File editing with real-time collaboration requires a Pro or Enterprise subscription."
      />
    </>
  );
};

export default FileList;