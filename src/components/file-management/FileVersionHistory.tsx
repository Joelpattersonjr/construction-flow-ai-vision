import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { CollaborativeEditingService, DocumentVersion } from '@/services/collaborativeEditingService';
import {
  History,
  Download,
  RotateCcw,
  FileText,
  User,
  Calendar,
  Hash,
  AlertTriangle,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface FileVersionHistoryProps {
  documentId: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
  onVersionRestore?: () => void;
}

export const FileVersionHistory = ({
  documentId,
  fileName,
  isOpen,
  onClose,
  onVersionRestore,
}: FileVersionHistoryProps) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, documentId]);

  const loadVersions = async () => {
    setIsLoading(true);
    try {
      const versionData = await CollaborativeEditingService.getFileVersions(documentId);
      setVersions(versionData);
    } catch (error) {
      console.error('Error loading versions:', error);
      toast({
        title: "Error",
        description: "Failed to load version history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevertToVersion = async (version: DocumentVersion) => {
    setIsRestoring(true);
    try {
      await CollaborativeEditingService.revertToVersion(documentId, version.version_number);
      toast({
        title: "Version restored",
        description: `Successfully reverted to version ${version.version_number}`,
      });
      onVersionRestore?.();
      onClose();
    } catch (error) {
      console.error('Error reverting version:', error);
      toast({
        title: "Error",
        description: "Failed to revert to selected version",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const downloadVersion = async (version: DocumentVersion) => {
    try {
      const blob = new Blob([version.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}_v${version.version_number}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: `Version ${version.version_number} is being downloaded`,
      });
    } catch (error) {
      console.error('Error downloading version:', error);
      toast({
        title: "Error",
        description: "Failed to download version",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getVersionBadgeVariant = (version: DocumentVersion, index: number) => {
    if (index === 0) return 'default'; // Latest version
    if (version.change_description?.includes('Reverted')) return 'secondary';
    if (version.change_description !== 'Auto-save') return 'outline'; // Manual versions
    return 'secondary'; // Auto-save versions
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History - {fileName}
          </DialogTitle>
          <DialogDescription>
            View and manage all versions of this document. You can restore to any previous version.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-6 h-full">
          {/* Version List */}
          <div className="flex-1">
            <ScrollArea className="h-[400px] pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No version history available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {versions.map((version, index) => (
                    <div
                      key={version.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedVersion?.id === version.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedVersion(version)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={getVersionBadgeVariant(version, index)}>
                              v{version.version_number}
                              {index === 0 && ' (Latest)'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatFileSize(version.file_size)}
                            </span>
                          </div>
                          
                          <p className="font-medium">{version.change_description}</p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{(version as any).profiles?.full_name || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(version.created_at), 'MMM d, yyyy HH:mm')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              <span className="font-mono">{version.content_hash.slice(0, 8)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadVersion(version);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          
                          {index > 0 && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                                    Restore Version {version.version_number}?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will replace the current document content with version {version.version_number}. 
                                    A new version will be created to preserve the current state before reverting.
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRevertToVersion(version)}
                                    disabled={isRestoring}
                                  >
                                    {isRestoring ? 'Restoring...' : 'Restore Version'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Version Preview */}
          {selectedVersion && (
            <>
              <Separator orientation="vertical" />
              <div className="flex-1">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Version {selectedVersion.version_number} Preview</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Created: {format(new Date(selectedVersion.created_at), 'PPP p')}</p>
                      <p>Size: {formatFileSize(selectedVersion.file_size)}</p>
                      <p>Description: {selectedVersion.change_description}</p>
                    </div>
                  </div>
                  
                  <ScrollArea className="h-[300px] border rounded-md p-3">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {selectedVersion.content || 'No content available'}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};