import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Calendar, FileType, User } from 'lucide-react';
import { FileItem, FileCategory } from '@/services/file';
import { formatDistanceToNow } from 'date-fns';

interface AdvancedFileSearchProps {
  files: FileItem[];
  onFilteredResults: (results: FileItem[]) => void;
  projectId: string;
}

interface SearchFilters {
  query: string;
  category: FileCategory | 'all';
  fileType: string;
  dateRange: string;
  uploader: string;
}

const AdvancedFileSearch: React.FC<AdvancedFileSearchProps> = ({
  files,
  onFilteredResults,
  projectId
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: 'all',
    fileType: 'all',
    dateRange: 'all',
    uploader: 'all'
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Extract unique values for filter options
  const fileTypes = Array.from(new Set(files.map(f => f.file_type).filter(Boolean)));
  const uploaders = Array.from(new Set(files.map(f => f.uploader_id).filter(Boolean)));

  useEffect(() => {
    applyFilters();
  }, [filters, files]);

  const applyFilters = () => {
    let filtered = [...files];

    // Text search
    if (filters.query.trim()) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(file =>
        file.file_name?.toLowerCase().includes(query) ||
        file.file_type?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(file => file.category === filters.category);
    }

    // File type filter
    if (filters.fileType !== 'all') {
      filtered = filtered.filter(file => file.file_type === filters.fileType);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      if (filters.dateRange !== 'all') {
        filtered = filtered.filter(file => 
          new Date(file.created_at) >= cutoffDate
        );
      }
    }

    // Uploader filter
    if (filters.uploader !== 'all') {
      filtered = filtered.filter(file => file.uploader_id === filters.uploader);
    }

    // Update active filters for display
    const active: string[] = [];
    if (filters.query.trim()) active.push(`Search: "${filters.query}"`);
    if (filters.category !== 'all') active.push(`Category: ${filters.category}`);
    if (filters.fileType !== 'all') active.push(`Type: ${filters.fileType}`);
    if (filters.dateRange !== 'all') active.push(`Date: ${filters.dateRange}`);
    if (filters.uploader !== 'all') active.push(`Uploader: ${filters.uploader}`);
    
    setActiveFilters(active);
    onFilteredResults(filtered);
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      category: 'all',
      fileType: 'all',
      dateRange: 'all',
      uploader: 'all'
    });
  };

  const removeFilter = (filterText: string) => {
    if (filterText.startsWith('Search:')) {
      setFilters(prev => ({ ...prev, query: '' }));
    } else if (filterText.startsWith('Category:')) {
      setFilters(prev => ({ ...prev, category: 'all' }));
    } else if (filterText.startsWith('Type:')) {
      setFilters(prev => ({ ...prev, fileType: 'all' }));
    } else if (filterText.startsWith('Date:')) {
      setFilters(prev => ({ ...prev, dateRange: 'all' }));
    } else if (filterText.startsWith('Uploader:')) {
      setFilters(prev => ({ ...prev, uploader: 'all' }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Main search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search files by name, type, or content..."
            value={filters.query}
            onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Advanced Filters</span>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={filters.category} onValueChange={(value: FileCategory | 'all') => 
                  setFilters(prev => ({ ...prev, category: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="project-documents">Project Documents</SelectItem>
                    <SelectItem value="project-photos">Project Photos</SelectItem>
                    <SelectItem value="blueprints">Blueprints</SelectItem>
                    <SelectItem value="site-photos">Site Photos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">File Type</label>
                <Select value={filters.fileType} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, fileType: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {fileTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <Select value={filters.dateRange} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, dateRange: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Past Week</SelectItem>
                    <SelectItem value="month">Past Month</SelectItem>
                    <SelectItem value="year">Past Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Uploader</label>
                <Select value={filters.uploader} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, uploader: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {uploaders.map(uploader => (
                      <SelectItem key={uploader} value={uploader}>
                        {uploader} {/* Would need to resolve to user name */}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {filter}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                onClick={() => removeFilter(filter)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdvancedFileSearch;