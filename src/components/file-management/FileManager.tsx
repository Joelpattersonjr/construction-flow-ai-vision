import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, Eye, Grid } from 'lucide-react';
import FileUploadDropzone from './FileUploadDropzone';
import FolderFileList from './FolderFileList';
import BulkFileOperations from './BulkFileOperations';
import FilePreviewDialog from './FilePreviewDialog';
import AdvancedFileSearch from './AdvancedFileSearch';
import { FileService, FileCategory, FolderItem, FileItem } from '@/services/file';
import { useToast } from '@/hooks/use-toast';
import { useProjectPermissions } from '@/hooks/useProjectPermissions';
import { useAuth } from '@/contexts/AuthContext';

interface FileManagerProps {
  projectId: string;
  hasWritePermission?: boolean;
}

const CATEGORY_OPTIONS: { value: FileCategory; label: string }[] = [
  { value: 'project-documents', label: 'Project Documents' },
  { value: 'project-photos', label: 'Project Photos' },
  { value: 'blueprints', label: 'Blueprints' },
  { value: 'site-photos', label: 'Site Photos' },
];

const FileManager: React.FC<FileManagerProps> = ({ projectId, hasWritePermission = false }) => {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filteredFolders, setFilteredFolders] = useState<FolderItem[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>('project-documents');
  const [currentPath, setCurrentPath] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<FolderItem[]>([]);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  
  // Use passed permission or fall back to hook-based check
  const { hasWritePermission: hookWritePermission, loading: permissionsLoading } = useProjectPermissions(projectId);
  const effectiveWritePermission = hasWritePermission || hookWritePermission;
  const hasAdminPermission = profile?.company_role === 'company_admin';

  const loadFolderContents = async () => {
    try {
      setLoading(true);
      const { folders: folderList, files: fileList } = await FileService.getFolderContents(
        projectId, 
        selectedCategory, 
        currentPath
      );
      setFolders(folderList);
      setFiles(fileList);
      setFilteredFolders(folderList);
      setFilteredFiles(fileList);
    } catch (error) {
      toast({
        title: "Failed to load files",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    setSearchTerm(''); // Clear search when navigating
  };

  useEffect(() => {
    loadFolderContents();
  }, [projectId, selectedCategory, currentPath]);

  useEffect(() => {
    if (!showAdvancedSearch) {
      let filteredFoldersList = folders;
      let filteredFilesList = files;

      // Filter by search term
      if (searchTerm.trim()) {
        filteredFoldersList = folders.filter(folder =>
          folder.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        filteredFilesList = files.filter(file =>
          file.file_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setFilteredFolders(filteredFoldersList);
      setFilteredFiles(filteredFilesList);
    }
  }, [folders, files, searchTerm, showAdvancedSearch]);

  const handleAdvancedSearchResults = (results: FileItem[]) => {
    setFilteredFiles(results);
    // For advanced search, show all folders or filter them too
    setFilteredFolders(folders);
  };

  const handleUploadComplete = () => {
    loadFolderContents();
  };

  const handleContentChanged = () => {
    loadFolderContents();
    // Clear selections when content changes
    setSelectedFiles([]);
    setSelectedFolders([]);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="browse" className="w-full">
        <TabsList className={`grid w-full ${effectiveWritePermission ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <TabsTrigger value="browse">Browse Files</TabsTrigger>
          {effectiveWritePermission && <TabsTrigger value="upload">Upload Files</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="browse" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              {showAdvancedSearch ? (
                <AdvancedFileSearch
                  files={files}
                  onFilteredResults={handleAdvancedSearchResults}
                  projectId={projectId}
                />
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            >
              <Grid className="h-4 w-4 mr-2" />
              {showAdvancedSearch ? 'Simple' : 'Advanced'} Search
            </Button>
            
            <Select value={selectedCategory} onValueChange={(value: FileCategory) => setSelectedCategory(value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={loadFolderContents} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <BulkFileOperations
            projectId={projectId}
            selectedFiles={selectedFiles}
            selectedFolders={selectedFolders}
            onSelectionChange={(files, folders) => {
              setSelectedFiles(files);
              setSelectedFolders(folders);
            }}
            onOperationComplete={handleContentChanged}
            hasAdminPermission={hasAdminPermission}
          />

          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-600">Loading files...</p>
            </div>
          ) : (
            <FolderFileList 
              projectId={projectId}
              category={selectedCategory}
              currentPath={currentPath}
              folders={filteredFolders} 
              files={filteredFiles} 
              onNavigate={handleNavigate}
              onContentsChanged={handleContentChanged}
              hasWritePermission={effectiveWritePermission}
              selectedFiles={selectedFiles}
              selectedFolders={selectedFolders}
              onSelectionChange={(files, folders) => {
                setSelectedFiles(files);
                setSelectedFolders(folders);
              }}
              onPreviewFile={setPreviewFile}
            />
          )}
        </TabsContent>
        
        {effectiveWritePermission && (
          <TabsContent value="upload">
            <FileUploadDropzone
              projectId={projectId}
              category={selectedCategory}
              currentPath={currentPath}
              onUploadComplete={handleUploadComplete}
            />
          </TabsContent>
        )}
      </Tabs>

      <FilePreviewDialog
        file={previewFile}
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        projectId={projectId}
      />
    </div>
  );
};

export default FileManager;