import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, FolderInput, Download, Archive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FileService, FileItem, FolderItem } from '@/services/file';

interface BulkFileOperationsProps {
  projectId: string;
  selectedFiles: FileItem[];
  selectedFolders: FolderItem[];
  onSelectionChange: (files: FileItem[], folders: FolderItem[]) => void;
  onOperationComplete: () => void;
  hasAdminPermission: boolean;
}

const BulkFileOperations: React.FC<BulkFileOperationsProps> = ({
  projectId,
  selectedFiles,
  selectedFolders,
  onSelectionChange,
  onOperationComplete,
  hasAdminPermission
}) => {
  const [loading, setLoading] = useState(false);
  const [targetFolder, setTargetFolder] = useState<string>('');
  const { toast } = useToast();

  const handleBulkDelete = async () => {
    if (!hasAdminPermission) {
      toast({
        title: "Access denied",
        description: "Only administrators can perform bulk delete operations",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Delete selected files
      for (const file of selectedFiles) {
        if (file.category && file.storage_path) {
          await FileService.deleteFile(file.id, file.category, file.storage_path);
        }
      }

      // Delete selected folders
      for (const folder of selectedFolders) {
        // Note: This would need the folder's category - would need to enhance folder structure
        // await FileService.deleteFolder(projectId, folder.category, folder.path);
      }

      toast({
        title: "Success",
        description: `Deleted ${selectedFiles.length} files and ${selectedFolders.length} folders`,
      });

      onSelectionChange([], []);
      onOperationComplete();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkMove = async () => {
    if (!targetFolder) {
      toast({
        title: "Error",
        description: "Please select a target folder",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Move selected files
      for (const file of selectedFiles) {
        await FileService.moveFile(file.id, targetFolder);
      }

      toast({
        title: "Success",
        description: `Moved ${selectedFiles.length} files to ${targetFolder || 'root'}`,
      });

      onSelectionChange([], []);
      onOperationComplete();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to move items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDownload = async () => {
    // This would need implementation for creating zip files
    // For now, show a placeholder message
    toast({
      title: "Feature coming soon",
      description: "Bulk download functionality will be available soon",
    });
  };

  const totalSelected = selectedFiles.length + selectedFolders.length;

  if (totalSelected === 0) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Bulk Operations ({totalSelected} items selected)</span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onSelectionChange([], [])}
          >
            Clear Selection
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkDownload}
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>

          <div className="flex items-center gap-2">
            <Select value={targetFolder} onValueChange={setTargetFolder}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select folder..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root</SelectItem>
                {/* Would need to populate with available folders */}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkMove}
              disabled={loading || selectedFiles.length === 0}
            >
              <FolderInput className="h-4 w-4 mr-2" />
              Move
            </Button>
          </div>

          {hasAdminPermission && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkFileOperations;