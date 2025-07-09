import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type FileCategory = 'project-documents' | 'project-photos' | 'blueprints' | 'site-photos';

export interface UploadFileParams {
  file: File;
  projectId: string;
  category: FileCategory;
  folderPath?: string; // Optional folder path within the project
}

export interface DocumentRecord extends Tables<'documents'> {}

export interface FolderItem {
  name: string;
  path: string;
  type: 'folder';
  created_at: string;
}

export interface FileItem extends DocumentRecord {
  type: 'file';
}

export class FileService {
  /**
   * Upload a file to Supabase Storage and create a database record
   */
  static async uploadFile({ file, projectId, category, folderPath = '' }: UploadFileParams): Promise<DocumentRecord> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const basePath = folderPath ? `${projectId}/${folderPath}` : projectId;
    const filePath = `${basePath}/${fileName}`;

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

  /**
   * Create a folder in the storage bucket
   */
  static async createFolder(projectId: string, category: FileCategory, folderPath: string): Promise<void> {
    // Create an empty placeholder file to establish the folder structure
    const placeholderPath = `${projectId}/${folderPath}/.gitkeep`;
    
    const placeholderFile = new Blob([''], { type: 'text/plain' });
    
    const { error } = await supabase.storage
      .from(category)
      .upload(placeholderPath, placeholderFile);

    if (error) {
      throw new Error(`Failed to create folder: ${error.message}`);
    }
  }

  /**
   * Get folder structure for a project and category
   */
  static async getFolderContents(projectId: string, category: FileCategory, folderPath: string = ''): Promise<{
    folders: FolderItem[];
    files: FileItem[];
  }> {
    const prefix = folderPath ? `${projectId}/${folderPath}/` : `${projectId}/`;
    
    // Get all files in storage for this path
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from(category)
      .list(folderPath ? `${projectId}/${folderPath}` : projectId);

    if (storageError) {
      throw new Error(`Failed to list storage contents: ${storageError.message}`);
    }

    // Get database records for files
    const { data: dbFiles, error: dbError } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .eq('category', category)
      .like('storage_path', `${prefix}%`)
      .not('storage_path', 'like', `${prefix}%/%`); // Only immediate children

    if (dbError) {
      throw new Error(`Failed to fetch file records: ${dbError.message}`);
    }

    // Separate folders and files
    const folders: FolderItem[] = [];
    const files: FileItem[] = [];

    storageFiles?.forEach(item => {
      if (item.name === '.gitkeep') return; // Skip placeholder files
      
      if (!item.metadata?.size) {
        // This is a folder
        folders.push({
          name: item.name,
          path: folderPath ? `${folderPath}/${item.name}` : item.name,
          type: 'folder',
          created_at: item.created_at || new Date().toISOString(),
        });
      }
    });

    // Add file records with type
    dbFiles?.forEach(file => {
      files.push({
        ...file,
        type: 'file' as const,
      });
    });

    return { folders, files };
  }

  /**
   * Delete a folder and all its contents
   */
  static async deleteFolder(projectId: string, category: FileCategory, folderPath: string): Promise<void> {
    const prefix = `${projectId}/${folderPath}/`;
    
    // List all files in the folder
    const { data: files, error: listError } = await supabase.storage
      .from(category)
      .list(`${projectId}/${folderPath}`, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

    if (listError) {
      throw new Error(`Failed to list folder contents: ${listError.message}`);
    }

    if (files && files.length > 0) {
      // Delete all files in storage
      const filePaths = files.map(file => `${projectId}/${folderPath}/${file.name}`);
      
      const { error: deleteError } = await supabase.storage
        .from(category)
        .remove(filePaths);

      if (deleteError) {
        throw new Error(`Failed to delete folder files: ${deleteError.message}`);
      }

      // Delete database records
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('project_id', projectId)
        .eq('category', category)
        .like('storage_path', `${prefix}%`);

      if (dbError) {
        console.warn('Failed to delete database records:', dbError.message);
      }
    }
  }
}