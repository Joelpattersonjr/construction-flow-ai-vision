import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderOpen, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FileService, FileCategory, FolderItem, FileItem } from '@/services/file';

interface MoveFileDialogProps {
  file: FileItem;
  projectId: string;
  category: FileCategory;
  currentPath: string;
  onFileMoved: () => void;
  children: React.ReactNode;
}

const MoveFileDialog: React.FC<MoveFileDialogProps> = ({
  file,
  projectId,
  category,
  currentPath,
  onFileMoved,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const { toast } = useToast();

  const loadFolders = async () => {
    setIsLoading(true);
    try {
      const folderList = await FileService.getAllFolders(projectId, category);
      // Filter out the current folder to prevent moving to the same location
      const filteredFolders = folderList.filter(folder => folder.path !== currentPath);
      setFolders(filteredFolders);
    } catch (error) {
      toast({
        title: "Failed to load folders",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadFolders();
      setSelectedFolderPath('');
    }
  }, [open]);

  const handleMoveFile = async () => {
    setIsMoving(true);
    try {
      // Convert ROOT_FOLDER back to empty string for the API
      const targetPath = selectedFolderPath === 'ROOT_FOLDER' ? '' : selectedFolderPath;
      await FileService.moveFile(file.id, targetPath);
      
      toast({
        title: "File moved",
        description: `"${file.file_name}" has been moved successfully`,
      });
      
      setOpen(false);
      onFileMoved();
    } catch (error) {
      toast({
        title: "Failed to move file",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsMoving(false);
    }
  };

  const getDisplayPath = (path: string) => {
    if (!path) return 'Root folder';
    return path.replace(/\//g, ' / ');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Move File</DialogTitle>
          <DialogDescription>
            Move "{file.file_name}" to a different folder.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Destination Folder</label>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-gray-500">Loading folders...</span>
              </div>
            ) : (
              <Select value={selectedFolderPath} onValueChange={setSelectedFolderPath}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination folder" />
                </SelectTrigger>
                <SelectContent>
                  {/* Add root folder option first */}
                  <SelectItem value="ROOT_FOLDER">
                    <div className="flex items-center">
                      <FolderOpen className="h-4 w-4 mr-2 text-blue-500" />
                      Root folder
                    </div>
                  </SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.path || 'root'} value={folder.path || 'ROOT_FOLDER'}>
                      <div className="flex items-center">
                        <FolderOpen className="h-4 w-4 mr-2 text-blue-500" />
                        {getDisplayPath(folder.path)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          {currentPath && (
            <div className="text-sm text-gray-500">
              Current location: {getDisplayPath(currentPath)}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isMoving}>
            Cancel
          </Button>
          <Button 
            onClick={handleMoveFile} 
            disabled={!selectedFolderPath || isMoving || isLoading}
          >
            {isMoving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Moving...
              </>
            ) : (
              'Move File'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoveFileDialog;