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

  async uploadFile(taskId: number, file: File): Promise<TaskFile> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
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
  }
};