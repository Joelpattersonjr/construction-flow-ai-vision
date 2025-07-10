import { supabase } from '@/integrations/supabase/client';
import { TablesInsert } from '@/integrations/supabase/types';
import { hasWritePermission } from './permissions';
import { FileCategory, UploadFileParams, DocumentRecord } from './types';
import { auditService } from '@/services/auditService';

/**
 * Upload a file to Supabase Storage and create a database record
 */
export async function uploadFile({ file, projectId, category, folderPath = '' }: UploadFileParams): Promise<DocumentRecord> {
  // Get current user first to ensure we have authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  // Validate file
  if (!file || file.size === 0) {
    throw new Error('Invalid file');
  }

  // Check write permissions
  const hasPermission = await hasWritePermission(projectId);
  if (!hasPermission) {
    throw new Error('You do not have permission to upload files to this project');
  }

  const fileExt = file.name.split('.').pop() || '';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
  const basePath = folderPath ? `${projectId}/${folderPath}` : projectId;
  const filePath = `${basePath}/${fileName}`;

  console.log('Uploading file:', {
    fileName: file.name,
    size: file.size,
    type: file.type,
    category,
    filePath,
    projectId
  });

  // Upload to storage bucket
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(category)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  console.log('File uploaded to storage successfully:', uploadData);

  // Create database record
  const documentData: TablesInsert<'documents'> = {
    project_id: projectId,
    file_name: file.name,
    file_type: file.type || 'application/octet-stream',
    category: category,
    storage_path: uploadData.path,
    uploader_id: user.id
  };

  const { data: document, error: dbError } = await supabase
    .from('documents')
    .insert(documentData)
    .select()
    .single();

  if (dbError) {
    console.error('Database insert error:', dbError);
    // Clean up uploaded file if database insert fails
    await supabase.storage.from(category).remove([filePath]);
    throw new Error(`Database insert failed: ${dbError.message}`);
  }

  console.log('Document record created successfully:', document);
  
  // Log file upload to audit trail
  await auditService.logActivity({
    projectId,
    actionType: 'member_added', // Will be enhanced with file-specific actions
    metadata: {
      action: 'file_uploaded',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      category,
      folderPath: folderPath || 'root'
    }
  });
  
  return document;
}

/**
 * Get all files for a specific project
 */
export async function getProjectFiles(projectId: string): Promise<DocumentRecord[]> {
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
export async function getFileUrl(category: FileCategory, storagePath: string, projectId?: string, fileName?: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(category)
    .createSignedUrl(storagePath, 3600); // 1 hour expiry

  if (error) {
    throw new Error(`Failed to get file URL: ${error.message}`);
  }

  // Log file access to audit trail if project info is provided
  if (projectId && fileName) {
    await auditService.logActivity({
      projectId,
      actionType: 'member_added', // Will be enhanced with file-specific actions
      metadata: {
        action: 'file_accessed',
        fileName,
        category
      }
    });
  }

  return data.signedUrl;
}

/**
 * Delete a file from storage and database
 */
export async function deleteFile(documentId: number, category: FileCategory, storagePath: string): Promise<void> {
  // Get file info for audit logging before deletion
  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('project_id, file_name')
    .eq('id', documentId)
    .single();

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

  // Log file deletion to audit trail
  if (!fetchError && document) {
    await auditService.logActivity({
      projectId: document.project_id,
      actionType: 'member_removed', // Will be enhanced with file-specific actions
      metadata: {
        action: 'file_deleted',
        fileName: document.file_name,
        category
      }
    });
  }
}

/**
 * Rename a file in the database
 */
export async function renameFile(documentId: number, newFileName: string): Promise<void> {
  // Check write permissions first
  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('project_id')
    .eq('id', documentId)
    .single();

  if (fetchError || !document) {
    throw new Error('File not found');
  }

  const hasPermission = await hasWritePermission(document.project_id);
  if (!hasPermission) {
    throw new Error('You do not have permission to rename files in this project');
  }

  // Validate new file name
  if (!newFileName.trim()) {
    throw new Error('File name cannot be empty');
  }

  // Get old filename for audit logging
  const { data: oldFile, error: oldFileError } = await supabase
    .from('documents')
    .select('file_name')
    .eq('id', documentId)
    .single();

  // Update the file name in the database
  const { error } = await supabase
    .from('documents')
    .update({ file_name: newFileName.trim() })
    .eq('id', documentId);

  if (error) {
    throw new Error(`Failed to rename file: ${error.message}`);
  }

  // Log file rename to audit trail
  if (!oldFileError && oldFile) {
    await auditService.logActivity({
      projectId: document.project_id,
      actionType: 'member_added', // Will be enhanced with file-specific actions
      metadata: {
        action: 'file_renamed',
        oldFileName: oldFile.file_name,
        newFileName: newFileName.trim()
      }
    });
  }
}

/**
 * Get files by category for a project
 */
export async function getFilesByCategory(projectId: string, category: FileCategory): Promise<DocumentRecord[]> {
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
 * Move a file to a different folder
 */
export async function moveFile(documentId: number, newFolderPath: string): Promise<void> {
  // Check write permissions first
  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('project_id, storage_path, category, file_name')
    .eq('id', documentId)
    .single();

  if (fetchError || !document) {
    throw new Error('File not found');
  }

  const hasPermission = await hasWritePermission(document.project_id);
  if (!hasPermission) {
    throw new Error('You do not have permission to move files in this project');
  }

  if (!document.storage_path || !document.category) {
    throw new Error('Invalid file data');
  }

  // Extract project ID and current file name from storage path
  const pathParts = document.storage_path.split('/');
  const fileName = pathParts[pathParts.length - 1];
  const projectId = pathParts[0];

  // Build new storage path
  const newStoragePath = newFolderPath 
    ? `${projectId}/${newFolderPath}/${fileName}`
    : `${projectId}/${fileName}`;

  // Move file in storage
  const { error: moveError } = await supabase.storage
    .from(document.category as FileCategory)
    .move(document.storage_path, newStoragePath);

  if (moveError) {
    throw new Error(`Failed to move file: ${moveError.message}`);
  }

  // Update database record with new storage path
  const { error: updateError } = await supabase
    .from('documents')
    .update({ storage_path: newStoragePath })
    .eq('id', documentId);

  if (updateError) {
    // Try to move the file back if database update fails
    await supabase.storage
      .from(document.category as FileCategory)
      .move(newStoragePath, document.storage_path);
    
    throw new Error(`Failed to update file record: ${updateError.message}`);
  }
}