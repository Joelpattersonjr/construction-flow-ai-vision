import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Folder, FolderOpen } from 'lucide-react';
import { FileCategory, FolderItem, FileItem } from '@/services/file';
import Breadcrumbs from './Breadcrumbs';
import CreateFolderDialog from './CreateFolderDialog';
import FolderItemComponent from './FolderItem';
import FileItemComponent from './FileItem';

interface FolderFileListProps {
  projectId: string;
  category: FileCategory;
  currentPath: string;
  folders: FolderItem[];
  files: FileItem[];
  onNavigate: (path: string) => void;
  onContentsChanged: () => void;
  hasWritePermission: boolean;
  selectedFiles?: FileItem[];
  selectedFolders?: FolderItem[];
  onSelectionChange?: (files: FileItem[], folders: FolderItem[]) => void;
  onPreviewFile?: (file: FileItem) => void;
}

const FolderFileList: React.FC<FolderFileListProps> = ({ 
  projectId,
  category,
  currentPath,
  folders, 
  files, 
  onNavigate, 
  onContentsChanged,
  hasWritePermission,
  selectedFiles = [],
  selectedFolders = [],
  onSelectionChange,
  onPreviewFile,
}) => {
  const handleFolderClick = (folderPath: string) => {
    onNavigate(folderPath);
  };

  if (folders.length === 0 && files.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Folder className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">No files or folders</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a folder or upload files to get started.
          </p>
          <div className="mt-4">
            <CreateFolderDialog
              projectId={projectId}
              category={category}
              currentPath={currentPath}
              onFolderCreated={onContentsChanged}
              disabled={!hasWritePermission}
            />
            {!hasWritePermission && (
              <p className="text-xs text-muted-foreground mt-2">
                You need write permissions to create folders
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center space-x-2">
                <FolderOpen className="h-5 w-5" />
                <span>Files & Folders ({folders.length + files.length})</span>
              </CardTitle>
              <Breadcrumbs currentPath={currentPath} onNavigate={onNavigate} />
            </div>
            <CreateFolderDialog
              projectId={projectId}
              category={category}
              currentPath={currentPath}
              onFolderCreated={onContentsChanged}
              disabled={!hasWritePermission}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Folders */}
            {folders.map((folder) => (
              <FolderItemComponent
                key={folder.path}
                folder={folder}
                projectId={projectId}
                category={category}
                hasWritePermission={hasWritePermission}
                onFolderClick={handleFolderClick}
                onFolderDeleted={onContentsChanged}
                isSelected={selectedFolders.some(f => f.path === folder.path)}
                onSelectionChange={(selected) => {
                  if (onSelectionChange) {
                    const newSelectedFolders = selected
                      ? [...selectedFolders, folder]
                      : selectedFolders.filter(f => f.path !== folder.path);
                    onSelectionChange(selectedFiles, newSelectedFolders);
                  }
                }}
              />
            ))}

            {/* Files */}
            {files.map((file) => (
              <FileItemComponent
                key={file.id}
                file={file}
                projectId={projectId}
                category={category}
                currentPath={currentPath}
                hasWritePermission={hasWritePermission}
                onFileDeleted={onContentsChanged}
                isSelected={selectedFiles.some(f => f.id === file.id)}
                onSelectionChange={(selected) => {
                  if (onSelectionChange) {
                    const newSelectedFiles = selected
                      ? [...selectedFiles, file]
                      : selectedFiles.filter(f => f.id !== file.id);
                    onSelectionChange(newSelectedFiles, selectedFolders);
                  }
                }}
                onPreview={() => onPreviewFile?.(file)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default FolderFileList;