import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Folder, FolderOpen, Edit2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { FolderItem, FileService, FileCategory } from '@/services/file';
import { useToast } from '@/hooks/use-toast';
import RenameDialog from './RenameDialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';

interface FolderItemProps {
  folder: FolderItem;
  projectId: string;
  category: FileCategory;
  hasWritePermission: boolean;
  onFolderClick: (folderPath: string) => void;
  onFolderDeleted: () => void;
}

const FolderItemComponent: React.FC<FolderItemProps> = ({
  folder,
  projectId,
  category,
  hasWritePermission,
  onFolderClick,
  onFolderDeleted,
}) => {
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleRename = async (newName: string) => {
    // Note: Folder renaming would require moving all contents
    // This is a placeholder for now
    toast({
      title: "Feature not implemented",
      description: "Folder renaming is not yet supported",
      variant: "destructive",
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await FileService.deleteFolder(projectId, category, folder.path);
      toast({
        title: "Folder deleted",
        description: `"${folder.name}" has been deleted successfully`,
      });
      onFolderDeleted();
      setIsDeleteOpen(false);
    } catch (error) {
      toast({
        title: "Failed to delete folder",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="group flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors">
        <div 
          className="flex items-center space-x-3 cursor-pointer flex-1"
          onClick={() => onFolderClick(folder.path)}
        >
          <div className="flex-shrink-0">
            <Folder className="h-6 w-6 text-blue-500 group-hover:hidden" />
            <FolderOpen className="h-6 w-6 text-blue-600 hidden group-hover:block" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {folder.name}
            </p>
            <p className="text-xs text-muted-foreground">
              Folder • {formatDistanceToNow(new Date(folder.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {hasWritePermission && (
            <>
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
                  <p>Rename folder</p>
                </TooltipContent>
              </Tooltip>

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
                  <p>Delete folder</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>

      <RenameDialog
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        currentName={folder.name}
        type="folder"
        onRename={handleRename}
      />

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Folder"
        description="Are you sure you want to delete the folder"
        itemName={folder.name}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default FolderItemComponent;