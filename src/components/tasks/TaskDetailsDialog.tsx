import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MessageSquare, Paperclip, Activity, Send, Download, Trash2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

import { TaskWithDetails } from '@/types/tasks';
import { taskCommentsService, TaskComment } from '@/services/taskCommentsService';
import { taskFilesService, TaskFile } from '@/services/taskFilesService';
import { taskActivityService, TaskActivity } from '@/services/taskActivityService';

interface TaskDetailsDialogProps {
  task: TaskWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TaskDetailsDialog: React.FC<TaskDetailsDialogProps> = ({
  task,
  open,
  onOpenChange,
}) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [activity, setActivity] = useState<TaskActivity[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (task && open) {
      loadTaskData();
    }
  }, [task, open]);

  const loadTaskData = async () => {
    if (!task) return;
    
    try {
      const [commentsData, filesData, activityData] = await Promise.all([
        taskCommentsService.getTaskComments(task.id),
        taskFilesService.getTaskFiles(task.id),
        taskActivityService.getTaskActivity(task.id),
      ]);
      
      setComments(commentsData);
      setFiles(filesData);
      setActivity(activityData);
    } catch (error) {
      toast({
        title: 'Error loading task data',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleAddComment = async () => {
    if (!task || !newComment.trim()) return;
    
    setIsLoading(true);
    try {
      const comment = await taskCommentsService.createComment(task.id, newComment.trim());
      setComments([...comments, comment]);
      setNewComment('');
      toast({ title: 'Comment added successfully' });
    } catch (error) {
      toast({
        title: 'Error adding comment',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!task || !file) return;

    setIsLoading(true);
    try {
      const taskFile = await taskFilesService.uploadFile(task.id, file);
      setFiles([taskFile, ...files]);
      toast({ title: 'File uploaded successfully' });
    } catch (error) {
      toast({
        title: 'Error uploading file',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFile = async (file: TaskFile) => {
    try {
      await taskFilesService.deleteFile(file.id, file.storage_path);
      setFiles(files.filter(f => f.id !== file.id));
      toast({ title: 'File deleted successfully' });
    } catch (error) {
      toast({
        title: 'Error deleting file',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadFile = async (file: TaskFile) => {
    try {
      const blob = await taskFilesService.downloadFile(file.storage_path);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: 'Error downloading file',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'Unknown size';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{task.title}</span>
            <Badge variant="outline">{task.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="comments" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Files ({files.length})
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity ({activity.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comments" className="space-y-4">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(comment.user?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {comment.user?.full_name || comment.user?.email}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.created_at), 'MMM d, HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="resize-none"
                rows={3}
              />
              <Button 
                onClick={handleAddComment} 
                disabled={!newComment.trim() || isLoading}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                type="file"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="hidden"
                id="file-upload"
              />
              <Button asChild disabled={isLoading}>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Upload File
                </label>
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {files.map((file) => (
                <Card key={file.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{file.file_name}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>•</span>
                          <span>
                            Uploaded by {file.uploader?.full_name || file.uploader?.email}
                          </span>
                          <span>•</span>
                          <span>{format(new Date(file.uploaded_at), 'MMM d, HH:mm')}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadFile(file)}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteFile(file)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {activity.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(item.user?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {item.user?.full_name || item.user?.email}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(item.created_at), 'MMM d, HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm">
                          {item.description || `${item.action_type} ${item.field_name || ''}`}
                          {item.old_value && item.new_value && (
                            <span className="text-muted-foreground">
                              {' '}from "{item.old_value}" to "{item.new_value}"
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};