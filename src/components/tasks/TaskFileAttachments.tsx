import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, File, Download, Trash2, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface TaskFile {
  id: string;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  storage_path: string;
  uploaded_at: string;
  uploaded_by: string;
  uploader: {
    full_name: string | null;
    email: string | null;
  };
}

interface TaskFileAttachmentsProps {
  taskId: number;
}

export const TaskFileAttachments: React.FC<TaskFileAttachmentsProps> = ({ taskId }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch files
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['task-files', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_files')
        .select(`
          id,
          file_name,
          file_size,
          file_type,
          storage_path,
          uploaded_at,
          uploaded_by,
          uploader:profiles!uploaded_by (
            full_name,
            email
          )
        `)
        .eq('task_id', taskId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as TaskFile[];
    },
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${taskId}/${Date.now()}.${fileExt}`;
      
      // Upload to storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('task-attachments')
        .upload(fileName, file);

      if (storageError) throw storageError;

      // Insert file record
      const { data, error } = await supabase
        .from('task_files')
        .insert({
          task_id: taskId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: storageData.path,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-files', taskId] });
      toast({ title: 'File uploaded successfully!' });
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error) => {
      toast({
        title: 'Error uploading file',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      setUploading(false);
    },
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (file: TaskFile) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('task-attachments')
        .remove([file.storage_path]);

      if (storageError) throw storageError;

      // Delete record
      const { error } = await supabase
        .from('task_files')
        .delete()
        .eq('id', file.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-files', taskId] });
      toast({ title: 'File deleted successfully!' });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting file',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Maximum file size is 10MB',
          variant: 'destructive',
        });
        return;
      }

      setUploading(true);
      uploadFileMutation.mutate(file);
    }
  };

  const handleDownload = async (file: TaskFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('task-attachments')
        .download(file.storage_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
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

  const handleDelete = (file: TaskFile) => {
    if (confirm(`Are you sure you want to delete "${file.file_name}"?`)) {
      deleteFileMutation.mutate(file);
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Attachments ({files.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-muted-foreground mb-2">
            Drop files here or click to browse
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            variant="outline"
            size="sm"
          >
            {uploading ? 'Uploading...' : 'Choose File'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Maximum file size: 10MB
          </p>
        </div>

        {/* Files list */}
        {isLoading ? (
          <div className="text-center py-4">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No files attached yet
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <File className="h-5 w-5 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)} • 
                      Uploaded by {file.uploader.full_name || file.uploader.email} • 
                      {format(new Date(file.uploaded_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(file)}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(file)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};