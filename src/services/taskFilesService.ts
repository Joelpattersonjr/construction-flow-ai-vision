import { supabase } from "@/integrations/supabase/client";

export interface TaskFile {
  id: string;
  task_id: number;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  storage_path: string;
  uploaded_at: string;
  uploaded_by: string;
  uploader?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

export const taskFilesService = {
  async getTaskFiles(taskId: number): Promise<TaskFile[]> {
    const { data, error } = await supabase
      .from('task_files')
      .select(`
        *,
        uploader:profiles(id, full_name, email)
      `)
      .eq('task_id', taskId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return (data || []) as TaskFile[];
  },

  async uploadFile(
    taskId: number, 
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<TaskFile> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `tasks/${taskId}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('task-attachments')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Create file record
    const { data, error } = await supabase
      .from('task_files')
      .insert({
        task_id: taskId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: filePath,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select(`
        *,
        uploader:profiles(id, full_name, email)
      `)
      .single();

    if (error) throw error;
    return data as TaskFile;
  },

  async deleteFile(fileId: string, storagePath: string): Promise<void> {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('task-attachments')
      .remove([storagePath]);

    if (storageError) throw storageError;

    // Delete record
    const { error } = await supabase
      .from('task_files')
      .delete()
      .eq('id', fileId);

    if (error) throw error;
  },

  async downloadFile(storagePath: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from('task-attachments')
      .download(storagePath);

    if (error) throw error;
    return data;
  },

  async getFileUrl(storagePath: string): Promise<string> {
    const { data } = await supabase.storage
      .from('task-attachments')
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    return data?.signedUrl || '';
  },

  async createFileVersion(fileId: string, file: File): Promise<TaskFile> {
    // Get original file info
    const { data: originalFile, error: fetchError } = await supabase
      .from('task_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fetchError) throw fetchError;

    // Upload new version
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-v${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `tasks/${originalFile.task_id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('task-attachments')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Create new version record
    const { data, error } = await supabase
      .from('task_files')
      .insert({
        task_id: originalFile.task_id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: filePath,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select(`
        *,
        uploader:profiles(id, full_name, email)
      `)
      .single();

    if (error) throw error;
    return data as TaskFile;
  },

  isImageFile(fileType: string | null): boolean {
    return fileType?.startsWith('image/') || false;
  },

  isPdfFile(fileType: string | null): boolean {
    return fileType === 'application/pdf';
  },

  isVideoFile(fileType: string | null): boolean {
    return fileType?.startsWith('video/') || false;
  },

  formatFileSize(bytes: number | null): string {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  },

  getFileIcon(fileType: string | null): string {
    if (!fileType) return '📄';
    if (this.isImageFile(fileType)) return '🖼️';
    if (this.isPdfFile(fileType)) return '📋';
    if (this.isVideoFile(fileType)) return '🎥';
    if (fileType.includes('audio')) return '🎵';
    if (fileType.includes('zip') || fileType.includes('archive')) return '📦';
    if (fileType.includes('text')) return '📝';
    return '📄';
  }
};