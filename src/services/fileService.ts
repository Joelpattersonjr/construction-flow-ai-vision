import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type FileCategory = 'project-documents' | 'project-photos' | 'blueprints' | 'site-photos';

export interface UploadFileParams {
  file: File;
  projectId: string;
  category: FileCategory;
}

export interface DocumentRecord extends Tables<'documents'> {}

export class FileService {
  /**
   * Upload a file to Supabase Storage and create a database record
   */
  static async uploadFile({ file, projectId, category }: UploadFileParams): Promise<DocumentRecord> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${projectId}/${fileName}`;

    // Upload to storage bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(category)
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Create database record
    const documentData: TablesInsert<'documents'> = {
      project_id: projectId,
      file_name: file.name,
      file_type: file.type,
      category: category,
      storage_path: uploadData.path,
      uploader_id: (await supabase.auth.getUser()).data.user?.id
    };

    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from(category).remove([filePath]);
      throw new Error(`Database insert failed: ${dbError.message}`);
    }

    return document;
  }

  /**
   * Get all files for a specific project
   */
  static async getProjectFiles(projectId: string): Promise<DocumentRecord[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch files: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get download URL for a file
   */
  static async getFileUrl(category: FileCategory, storagePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(category)
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (error) {
      throw new Error(`Failed to get file URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Delete a file from storage and database
   */
  static async deleteFile(documentId: number, category: FileCategory, storagePath: string): Promise<void> {
    // Delete from database first
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      throw new Error(`Failed to delete from database: ${dbError.message}`);
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(category)
      .remove([storagePath]);

    if (storageError) {
      console.warn('Failed to delete from storage:', storageError.message);
      // Don't throw here as the database record is already deleted
    }
  }

  /**
   * Get files by category for a project
   */
  static async getFilesByCategory(projectId: string, category: FileCategory): Promise<DocumentRecord[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch files: ${error.message}`);
    }

    return data || [];
  }
}