import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MessageSquare, Paperclip, Activity, Send, Download, Trash2, Tag, Eye, Upload, Clock, GitBranch, Edit2, Check, X, History } from 'lucide-react';

import { TaskLabelsManager } from './TaskLabelsManager';
import { FileUploadDropzone } from './FileUploadDropzone';
import { FilePreviewDialog } from './FilePreviewDialog';
import { FileVersionManager } from './FileVersionManager';
import { TaskTimeTracker } from './TaskTimeTracker';
import { TaskDependencies } from './TaskDependencies';

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

import { Task, TaskWithDetails, TaskLabel } from '@/types/tasks';
import { taskCommentsService, TaskComment } from '@/services/taskCommentsService';
import { taskFilesService, TaskFile } from '@/services/taskFilesService';
import { taskActivityService, TaskActivity } from '@/services/taskActivityService';
import { taskService } from '@/services/taskService';
import { supabase } from '@/integrations/supabase/client';

interface TaskDetailsDialogProps {
  task: TaskWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdate?: (updates: Partial<Task>) => void;
}

export const TaskDetailsDialog: React.FC<TaskDetailsDialogProps> = ({
  task,
  open,
  onOpenChange,
  onTaskUpdate,
}) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [activity, setActivity] = useState<TaskActivity[]>([]);
  const [labels, setLabels] = useState<TaskLabel[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<TaskFile | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [versionManagerFile, setVersionManagerFile] = useState<TaskFile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (task && open) {
      loadTaskData();
      
      // Set up real-time comments subscription
      const commentsChannel = supabase
        .channel(`task-comments-${task.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'task_comments',
            filter: `task_id=eq.${task.id}`
          },
          async (payload) => {
            // Fetch the new comment with user details
            const { data: newComment } = await supabase
              .from('task_comments')
              .select(`
                *,
                user:profiles(id, full_name, email)
              `)
              .eq('id', payload.new.id)
              .single();
            
            if (newComment) {
              setComments(prev => [...prev, newComment as TaskComment]);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'task_comments',
            filter: `task_id=eq.${task.id}`
          },
          async (payload) => {
            // Fetch the updated comment with user details
            const { data: updatedComment } = await supabase
              .from('task_comments')
              .select(`
                *,
                user:profiles(id, full_name, email)
              `)
              .eq('id', payload.new.id)
              .single();
            
            if (updatedComment) {
              setComments(prev => 
                prev.map(comment => 
                  comment.id === payload.new.id ? updatedComment as TaskComment : comment
                )
              );
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'task_comments',
            filter: `task_id=eq.${task.id}`
          },
          (payload) => {
            setComments(prev => prev.filter(comment => comment.id !== payload.old.id));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(commentsChannel);
      };
    }
  }, [task, open]);

  const loadTaskData = async () => {
    if (!task) return;
    
    try {
      const [commentsData, filesData, activityData, labelsData] = await Promise.all([
        taskCommentsService.getTaskComments(task.id),
        taskFilesService.getTaskFiles(task.id),
        taskActivityService.getTaskActivity(task.id),
        taskService.getTaskLabels(task.id),
      ]);
      
      setComments(commentsData);
      setFiles(filesData);
      setActivity(activityData);
      setLabels(labelsData);
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
      // Don't update state here - let real-time subscription handle it
      await taskCommentsService.createComment(task.id, newComment.trim());
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

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    
    try {
      await taskCommentsService.updateComment(commentId, editContent.trim());
      setEditingComment(null);
      setEditContent('');
      toast({ title: 'Comment updated successfully' });
    } catch (error) {
      toast({
        title: 'Error updating comment',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await taskCommentsService.deleteComment(commentId);
      toast({ title: 'Comment deleted successfully' });
    } catch (error) {
      toast({
        title: 'Error deleting comment',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const startEditing = (comment: TaskComment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      action();
    }
  };

  const handleFileUploaded = (newFile: TaskFile) => {
    setFiles([newFile, ...files]);
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

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="details">
              Details
            </TabsTrigger>
            <TabsTrigger value="dependencies" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Dependencies
            </TabsTrigger>
            <TabsTrigger value="time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time
            </TabsTrigger>
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

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Task Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.description && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Priority</h4>
                    <Badge variant="outline">{task.priority}</Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">Status</h4>
                    <Badge variant="outline">{task.status}</Badge>
                  </div>
                  {task.assignee && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Assignee</h4>
                      <p className="text-sm">{task.assignee.full_name || task.assignee.email}</p>
                    </div>
                  )}
                  {task.project && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Project</h4>
                      <p className="text-sm">{task.project.name}</p>
                    </div>
                  )}
                </div>
                
                {(task.start_date || task.end_date) && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Timeline</h4>
                    <div className="text-sm text-muted-foreground">
                      {task.start_date && (
                        <span>Start: {format(new Date(task.start_date), 'MMM d, yyyy')}</span>
                      )}
                      {task.start_date && task.end_date && <span> • </span>}
                      {task.end_date && (
                        <span>End: {format(new Date(task.end_date), 'MMM d, yyyy')}</span>
                      )}
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium text-sm mb-2">Labels</h4>
                  <TaskLabelsManager
                    taskId={task.id}
                    labels={labels}
                    onLabelsChange={setLabels}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dependencies" className="space-y-4">
            {task && onTaskUpdate && (
              <TaskDependencies
                task={task}
                onTaskUpdate={onTaskUpdate}
              />
            )}
          </TabsContent>

          <TabsContent value="time" className="space-y-4">
            {task && (
              <TaskTimeTracker
                taskId={task.id}
                taskTitle={task.title || 'Untitled Task'}
              />
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {comments.map((comment) => (
                <Card key={comment.id} className="group">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(comment.user?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {comment.user?.full_name || comment.user?.email}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.created_at), 'MMM d, HH:mm')}
                            </span>
                            {comment.updated_at !== comment.created_at && (
                              <span className="text-xs text-muted-foreground italic">
                                (edited)
                              </span>
                            )}
                          </div>
                          
                          {/* Comment Actions - show on hover or when editing */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {editingComment !== comment.id && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEditing(comment)}
                                  className="h-6 w-6 p-0"
                                  title="Edit comment"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                  title="Delete comment"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {editingComment === comment.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, () => handleEditComment(comment.id))}
                              className="text-sm resize-none"
                              rows={2}
                              placeholder="Edit your comment..."
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleEditComment(comment.id)}
                                disabled={!editContent.trim()}
                                className="h-7"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                                className="h-7"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {comments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No comments yet</p>
                  <p className="text-sm">Start the conversation by adding a comment</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Textarea
                placeholder="Add a comment... (Ctrl+Enter to send)"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleAddComment)}
                className="resize-none"
                rows={3}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Press Ctrl+Enter to send
                </span>
                <Button 
                  onClick={handleAddComment} 
                  disabled={!newComment.trim() || isLoading}
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-1" />
                  {isLoading ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            {task && (
              <FileUploadDropzone
                taskId={task.id}
                onFileUploaded={handleFileUploaded}
                allowMultiple={true}
                maxSize={100}
              />
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {files.map((file) => (
                <Card key={file.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-2xl">
                          {taskFilesService.getFileIcon(file.file_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{file.file_name}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{taskFilesService.formatFileSize(file.file_size)}</span>
                            <span>•</span>
                            <span>
                              {file.uploader?.full_name || file.uploader?.email}
                            </span>
                            <span>•</span>
                            <span>{format(new Date(file.uploaded_at), 'MMM d, HH:mm')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {(taskFilesService.isImageFile(file.file_type) || 
                          taskFilesService.isPdfFile(file.file_type)) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPreviewFile(file)}
                            className="h-8 w-8 p-0"
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                         <Button
                           size="sm"
                           variant="ghost"
                           onClick={() => setVersionManagerFile(file)}
                           className="h-8 w-8 p-0"
                           title="Version History"
                         >
                           <History className="h-4 w-4" />
                         </Button>
                         <Button
                           size="sm"
                           variant="ghost"
                           onClick={() => handleDownloadFile(file)}
                           className="h-8 w-8 p-0"
                           title="Download"
                         >
                           <Download className="h-4 w-4" />
                         </Button>
                         <Button
                           size="sm"
                           variant="ghost"
                           onClick={() => handleDeleteFile(file)}
                           className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                           title="Delete"
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {files.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No files attached yet</p>
                  <p className="text-sm">Drag and drop files above to get started</p>
                </div>
              )}
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
        
        <FilePreviewDialog
          file={previewFile}
          open={!!previewFile}
          onOpenChange={(open) => !open && setPreviewFile(null)}
        />
        
        <FileVersionManager
          file={versionManagerFile}
          open={!!versionManagerFile}
          onOpenChange={(open) => !open && setVersionManagerFile(null)}
          onNewVersion={(newVersion) => {
            setFiles(prev => [newVersion, ...prev]);
            setVersionManagerFile(null);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};