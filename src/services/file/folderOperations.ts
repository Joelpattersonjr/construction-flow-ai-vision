import { supabase } from '@/integrations/supabase/client';
import { hasWritePermission } from './permissions';
import { FileCategory, FolderItem, FileItem } from './types';

/**
 * Create a folder in the storage bucket
 */
export async function createFolder(projectId: string, category: FileCategory, folderPath: string): Promise<void> {
  // Check write permissions first
  const hasPermission = await hasWritePermission(projectId);
  if (!hasPermission) {
    throw new Error('You do not have permission to create folders in this project');
  }

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
export async function getFolderContents(projectId: string, category: FileCategory, folderPath: string = ''): Promise<{
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
 * Get all folders for a project and category (for move dialog)
 */
export async function getAllFolders(projectId: string, category: FileCategory): Promise<FolderItem[]> {
  const { data: storageFiles, error: storageError } = await supabase.storage
    .from(category)
    .list(projectId, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

  if (storageError) {
    throw new Error(`Failed to list folders: ${storageError.message}`);
  }

  const folders: FolderItem[] = [
    // Add root folder option
    {
      name: 'Root',
      path: '',
      type: 'folder',
      created_at: new Date().toISOString(),
    }
  ];

  // Recursively get all folder paths
  const getAllFolderPaths = (files: any[], basePath: string = ''): void => {
    files?.forEach(item => {
      if (!item.metadata?.size && item.name !== '.gitkeep') {
        // This is a folder
        const folderPath = basePath ? `${basePath}/${item.name}` : item.name;
        folders.push({
          name: item.name,
          path: folderPath,
          type: 'folder',
          created_at: item.created_at || new Date().toISOString(),
        });
      }
    });
  };

  getAllFolderPaths(storageFiles);

  return folders;
}

/**
 * Delete a folder and all its contents
 */
export async function deleteFolder(projectId: string, category: FileCategory, folderPath: string): Promise<void> {
  // Check write permissions first
  const hasPermission = await hasWritePermission(projectId);
  if (!hasPermission) {
    throw new Error('You do not have permission to delete folders in this project');
  }

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