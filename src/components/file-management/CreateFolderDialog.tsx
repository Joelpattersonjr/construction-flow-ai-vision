import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FolderPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FileService, FileCategory } from '@/services/fileService';

interface CreateFolderDialogProps {
  projectId: string;
  category: FileCategory;
  currentPath: string;
  onFolderCreated: () => void;
}

const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({
  projectId,
  category,
  currentPath,
  onFolderCreated,
}) => {
  const [open, setOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;

    setIsCreating(true);
    try {
      const folderPath = currentPath ? `${currentPath}/${folderName.trim()}` : folderName.trim();
      
      await FileService.createFolder(projectId, category, folderPath);
      
      toast({
        title: "Folder created",
        description: `"${folderName}" has been created successfully`,
      });
      
      setOpen(false);
      setFolderName('');
      onFolderCreated();
    } catch (error) {
      toast({
        title: "Failed to create folder",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && folderName.trim() && !isCreating) {
      handleCreateFolder();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FolderPlus className="h-4 w-4 mr-2" />
          New Folder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            Create a new folder in {currentPath || 'the project root'}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="folder-name" className="text-right text-sm font-medium">
              Name
            </label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter folder name"
              className="col-span-3"
              disabled={isCreating}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateFolder} 
            disabled={!folderName.trim() || isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Folder'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFolderDialog;