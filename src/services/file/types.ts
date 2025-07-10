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