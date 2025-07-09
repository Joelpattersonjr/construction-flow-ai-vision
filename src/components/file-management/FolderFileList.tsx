import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { File, Download, Trash2, Image, FileText, Archive, Folder, FolderOpen } from 'lucide-react';
import { FileService, FileCategory, FolderItem, FileItem } from '@/services/fileService';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import Breadcrumbs from './Breadcrumbs';
import CreateFolderDialog from './CreateFolderDialog';

interface FolderFileListProps {
  projectId: string;
  category: FileCategory;
  currentPath: string;
  folders: FolderItem[];
  files: FileItem[];
  onNavigate: (path: string) => void;
  onContentChanged: () => void;
}

const getFileIcon = (fileType: string | null) => {
  if (!fileType) return <File className="h-4 w-4" />;
  
  if (fileType.startsWith('image/')) {
    return <Image className="h-4 w-4 text-blue-500" />;
  }
  
  if (fileType === 'application/pdf' || fileType.includes('document')) {
    return <FileText className="h-4 w-4 text-red-500" />;
  }
  
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('archive')) {
    return <Archive className="h-4 w-4 text-orange-500" />;
  }
  
  return <File className="h-4 w-4 text-gray-500" />;
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

const FolderFileList: React.FC<FolderFileListProps> = ({ 
  projectId,
  category,
  currentPath,
  folders, 
  files, 
  onNavigate, 
  onContentChanged 
}) => {
  const [downloadingFiles, setDownloadingFiles] = useState<Set<number>>(new Set());
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleDownload = async (file: FileItem) => {
    if (!file.storage_path || !file.category) return;
    
    setDownloadingFiles(prev => new Set(prev).add(file.id));
    
    try {
      const url = await FileService.getFileUrl(file.category as FileCategory, file.storage_path);
      
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

  const handleDeleteFile = async (file: FileItem) => {
    if (!file.storage_path || !file.category) return;
    
    setDeletingItems(prev => new Set(prev).add(`file-${file.id}`));
    
    try {
      await FileService.deleteFile(file.id, file.category as FileCategory, file.storage_path);
      
      toast({
        title: "File deleted",
        description: `${file.file_name} has been deleted successfully`,
      });
      
      onContentChanged();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive",
      });
    } finally {
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(`file-${file.id}`);
        return newSet;
      });
    }
  };

  const handleDeleteFolder = async (folder: FolderItem) => {
    setDeletingItems(prev => new Set(prev).add(`folder-${folder.path}`));
    
    try {
      await FileService.deleteFolder(projectId, category, folder.path);
      
      toast({
        title: "Folder deleted",
        description: `${folder.name} and all its contents have been deleted successfully`,
      });
      
      onContentChanged();
    } catch (error) {
      toast({
        title: "Delete failed", 
        description: error instanceof Error ? error.message : "Failed to delete folder",
        variant: "destructive",
      });
    } finally {
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(`folder-${folder.path}`);
        return newSet;
      });
    }
  };

  const handleFolderClick = (folder: FolderItem) => {
    onNavigate(folder.path);
  };

  if (folders.length === 0 && files.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Folder className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No files or folders</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create a folder or upload files to get started.
          </p>
          <div className="mt-4">
            <CreateFolderDialog
              projectId={projectId}
              category={category}
              currentPath={currentPath}
              onFolderCreated={onContentChanged}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5" />
              <span>Files & Folders ({folders.length + files.length})</span>
            </CardTitle>
            <Breadcrumbs currentPath={currentPath} onNavigate={onNavigate} />
          </div>
          <CreateFolderDialog
            projectId={projectId}
            category={category}
            currentPath={currentPath}
            onFolderCreated={onContentChanged}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Folders */}
          {folders.map((folder) => (
            <div
              key={folder.path}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer group"
              onClick={() => handleFolderClick(folder)}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <Folder className="h-5 w-5 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {folder.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Folder • {formatDistanceToNow(new Date(folder.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                      disabled={deletingItems.has(`folder-${folder.path}`)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Folder</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{folder.name}" and all its contents? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteFolder(folder)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Folder
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}

          {/* Files */}
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
                      disabled={deletingItems.has(`file-${file.id}`)}
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
                        onClick={() => handleDeleteFile(file)}
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

export default FolderFileList;