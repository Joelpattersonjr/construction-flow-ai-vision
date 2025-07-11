import React, { useState, useEffect } from 'react';
import { History, Upload, Download, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { taskFilesService, TaskFile } from '@/services/taskFilesService';

interface FileVersionManagerProps {
  file: TaskFile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNewVersion?: (newFile: TaskFile) => void;
}

export const FileVersionManager: React.FC<FileVersionManagerProps> = ({
  file,
  open,
  onOpenChange,
  onNewVersion,
}) => {
  const [versions, setVersions] = useState<TaskFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (file && open) {
      loadFileVersions();
    }
  }, [file, open]);

  const loadFileVersions = async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      // Get all files with the same base name (for version tracking)
      const allFiles = await taskFilesService.getTaskFiles(file.task_id);
      const baseFileName = file.file_name.split('.')[0];
      
      // Filter files that are versions of the current file
      const fileVersions = allFiles.filter(f => 
        f.file_name.startsWith(baseFileName) || f.id === file.id
      ).sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
      
      setVersions(fileVersions);
    } catch (error) {
      toast({
        title: 'Error loading versions',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadNewVersion = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFile = event.target.files?.[0];
    if (!file || !newFile) return;

    setUploadingVersion(true);
    try {
      const newVersion = await taskFilesService.createFileVersion(file.id, newFile);
      setVersions([newVersion, ...versions]);
      onNewVersion?.(newVersion);
      
      toast({
        title: 'New version uploaded',
        description: `Version of ${file.file_name} uploaded successfully`,
      });
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      toast({
        title: 'Error uploading version',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setUploadingVersion(false);
    }
  };

  const handleDownload = async (version: TaskFile) => {
    try {
      const blob = await taskFilesService.downloadFile(version.storage_path);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = version.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download started',
        description: `Downloading ${version.file_name}`,
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getVersionNumber = (index: number): string => {
    return `v${versions.length - index}`;
  };

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History - {file.file_name}
            </DialogTitle>
            
            <div className="flex items-center gap-2">
              <Input
                type="file"
                className="hidden"
                id="version-upload"
                onChange={handleUploadNewVersion}
                disabled={uploadingVersion}
                accept={file.file_type || '*/*'}
              />
              <Button
                variant="outline"
                size="sm"
                asChild
                disabled={uploadingVersion}
              >
                <label htmlFor="version-upload" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingVersion ? 'Uploading...' : 'Upload New Version'}
                </label>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-muted-foreground">Loading versions...</p>
              </div>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No versions found</p>
              <p className="text-sm">Upload a new version to start tracking changes</p>
            </div>
          ) : (
            versions.map((version, index) => (
              <Card key={version.id} className={index === 0 ? 'border-primary' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(version.uploader?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {version.file_name}
                          </h4>
                          <Badge variant={index === 0 ? 'default' : 'outline'}>
                            {index === 0 ? 'Latest' : getVersionNumber(index)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{taskFilesService.formatFileSize(version.file_size)}</span>
                          <span>•</span>
                          <span>
                            {version.uploader?.full_name || version.uploader?.email}
                          </span>
                          <span>•</span>
                          <span>
                            {format(new Date(version.uploaded_at), 'MMM d, yyyy HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(version)}
                        className="h-8 w-8 p-0"
                        title="Download this version"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(version)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground">
            {versions.length} version{versions.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};