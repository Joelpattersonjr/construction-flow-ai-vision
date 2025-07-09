import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw } from 'lucide-react';
import FileUploadDropzone from './FileUploadDropzone';
import FileList from './FileList';
import { DocumentRecord, FileService, FileCategory } from '@/services/fileService';
import { useToast } from '@/hooks/use-toast';

interface FileManagerProps {
  projectId: string;
}

const CATEGORY_OPTIONS: { value: FileCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'project-documents', label: 'Project Documents' },
  { value: 'project-photos', label: 'Project Photos' },
  { value: 'blueprints', label: 'Blueprints' },
  { value: 'site-photos', label: 'Site Photos' },
];

const FileManager: React.FC<FileManagerProps> = ({ projectId }) => {
  const [files, setFiles] = useState<DocumentRecord[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | 'all'>('all');
  const { toast } = useToast();

  const loadFiles = async () => {
    try {
      setLoading(true);
      const projectFiles = await FileService.getProjectFiles(projectId);
      setFiles(projectFiles);
      setFilteredFiles(projectFiles);
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

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  useEffect(() => {
    let filtered = files;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(file => file.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(file =>
        file.file_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFiles(filtered);
  }, [files, selectedCategory, searchTerm]);

  const handleUploadComplete = () => {
    loadFiles();
  };

  const handleFileDeleted = () => {
    loadFiles();
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Files</TabsTrigger>
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
        </TabsList>
        
        <TabsContent value="browse" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={(value: FileCategory | 'all') => setSelectedCategory(value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={loadFiles} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-600">Loading files...</p>
            </div>
          ) : (
            <FileList files={filteredFiles} onFileDeleted={handleFileDeleted} />
          )}
        </TabsContent>
        
        <TabsContent value="upload">
          <FileUploadDropzone
            projectId={projectId}
            onUploadComplete={handleUploadComplete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FileManager;