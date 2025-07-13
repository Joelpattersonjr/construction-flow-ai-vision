import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { File, Download, Trash2, Image, FileText, Archive, Edit2, FolderInput, Pencil } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { FileItem, FileService, FileCategory } from '@/services/file';
import { useToast } from '@/hooks/use-toast';
import { fileAnalyticsService } from '@/services/fileAnalyticsService';
import RenameDialog from './RenameDialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import MoveFileDialog from './MoveFileDialog';

interface FileItemProps {
  file: FileItem;
  projectId: string;
  category: FileCategory;
  currentPath: string;
  hasWritePermission: boolean;
  onFileDeleted: () => void;
  isSelected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
  onPreview?: () => void;
  onEdit?: () => void;
}

const getFileIcon = (fileType: string | null) => {
  if (!fileType) return FileText;
  
  if (fileType.startsWith('image/')) return Image;
  if (fileType === 'application/pdf') return FileText;
  if (fileType.includes('zip') || fileType.includes('rar')) return Archive;
  
  return File;
};

const FileItemComponent: React.FC<FileItemProps> = ({
  file,
  projectId,
  category,
  currentPath,
  hasWritePermission,
  onFileDeleted,
  isSelected = false,
  onSelectionChange,
  onPreview,
  onEdit,
}) => {
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const FileIcon = getFileIcon(file.file_type);

  const handleDownload = async () => {
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

      // Track download analytics
      await fileAnalyticsService.trackFileAction({
        projectId,
        fileId: file.id,
        actionType: 'download'
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleRename = async (newName: string) => {
    try {
      await FileService.renameFile(file.id, newName);
      toast({
        title: "File renamed",
        description: `File renamed to "${newName}" successfully`,
      });
      onFileDeleted(); // Refresh the list
    } catch (error) {
      toast({
        title: "Failed to rename file",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!file.storage_path || !file.category) {
      toast({
        title: "Delete failed",
        description: "File information is incomplete",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      await FileService.deleteFile(file.id, file.category as FileCategory, file.storage_path);
      toast({
        title: "File deleted",
        description: `"${file.file_name}" has been deleted successfully`,
      });
      onFileDeleted();
      setIsDeleteOpen(false);
    } catch (error) {
      toast({
        title: "Failed to delete file",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
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

  return (
    <>
      <div className={`group flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors ${isSelected ? 'bg-muted/50 ring-2 ring-primary' : ''}`}>
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {onSelectionChange && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelectionChange(e.target.checked)}
              className="rounded border-gray-300"
            />
          )}
          <div className="flex-shrink-0">
            <FileIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div 
            className="flex-1 min-w-0 cursor-pointer" 
            onClick={onPreview}
          >
            <p className="text-sm font-medium text-foreground truncate hover:text-primary">
              {file.file_name}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {file.category?.replace('-', ' ')}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download file</p>
            </TooltipContent>
          </Tooltip>

          {hasWritePermission && (
            <>
              {isTextFile(file.file_type) && onEdit && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onEdit}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit file</p>
                  </TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRenameOpen(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Rename file</p>
                </TooltipContent>
              </Tooltip>

              <MoveFileDialog
                file={file}
                projectId={projectId}
                category={category}
                currentPath={currentPath}
                onFileMoved={onFileDeleted}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FolderInput className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Move file</p>
                  </TooltipContent>
                </Tooltip>
              </MoveFileDialog>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete file</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>

      <RenameDialog
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        currentName={file.file_name || ''}
        type="file"
        onRename={handleRename}
      />

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete File"
        description="Are you sure you want to delete the file"
        itemName={file.file_name || 'Unknown file'}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default FileItemComponent;