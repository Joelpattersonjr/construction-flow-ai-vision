// Export all types
export * from './types';

// Export all functions
export { hasWritePermission } from './permissions';
export {
  uploadFile,
  getProjectFiles,
  getFileUrl,
  deleteFile,
  renameFile,
  getFilesByCategory,
  moveFile
} from './fileOperations';
export {
  createFolder,
  getFolderContents,
  getAllFolders,
  deleteFolder
} from './folderOperations';

// Legacy FileService class for backward compatibility
export class FileService {
  static hasWritePermission = async (projectId: string) => {
    const { hasWritePermission } = await import('./permissions');
    return hasWritePermission(projectId);
  };

  static uploadFile = async (params: any) => {
    const { uploadFile } = await import('./fileOperations');
    return uploadFile(params);
  };

  static getProjectFiles = async (projectId: string) => {
    const { getProjectFiles } = await import('./fileOperations');  
    return getProjectFiles(projectId);
  };

  static getFileUrl = async (category: any, storagePath: string) => {
    const { getFileUrl } = await import('./fileOperations');
    return getFileUrl(category, storagePath);
  };

  static deleteFile = async (documentId: number, category: any, storagePath: string) => {
    const { deleteFile } = await import('./fileOperations');
    return deleteFile(documentId, category, storagePath);
  };

  static renameFile = async (documentId: number, newFileName: string) => {
    const { renameFile } = await import('./fileOperations');
    return renameFile(documentId, newFileName);
  };

  static getFilesByCategory = async (projectId: string, category: any) => {
    const { getFilesByCategory } = await import('./fileOperations');
    return getFilesByCategory(projectId, category);
  };

  static createFolder = async (projectId: string, category: any, folderPath: string) => {
    const { createFolder } = await import('./folderOperations');
    return createFolder(projectId, category, folderPath);
  };

  static getFolderContents = async (projectId: string, category: any, folderPath?: string) => {
    const { getFolderContents } = await import('./folderOperations');
    return getFolderContents(projectId, category, folderPath);
  };

  static moveFile = async (documentId: number, newFolderPath: string) => {
    const { moveFile } = await import('./fileOperations');
    return moveFile(documentId, newFolderPath);
  };

  static getAllFolders = async (projectId: string, category: any) => {
    const { getAllFolders } = await import('./folderOperations');
    return getAllFolders(projectId, category);
  };

  static deleteFolder = async (projectId: string, category: any, folderPath: string) => {
    const { deleteFolder } = await import('./folderOperations');
    return deleteFolder(projectId, category, folderPath);
  };
}