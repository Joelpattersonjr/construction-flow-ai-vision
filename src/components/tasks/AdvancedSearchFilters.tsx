import React, { useState } from 'react';
import { Search, Filter, Calendar, User, Tag, Clock, Save, Bookmark, X } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export interface AdvancedSearchFilters {
  searchTerm: string;
  searchFields: string[];
  selectedProject: string;
  selectedStatus: string[];
  selectedPriority: string[];
  selectedLabels: string[];
  selectedAssignee: string;
  dueDateFrom: Date | undefined;
  dueDateTo: Date | undefined;
  createdDateFrom: Date | undefined;
  createdDateTo: Date | undefined;
  hasTimeLogged: boolean | null;
  isOverdue: boolean | null;
  quickFilters: string[];
}

interface AdvancedSearchFiltersProps {
  filters: AdvancedSearchFilters;
  onFiltersChange: (filters: AdvancedSearchFilters) => void;
  projects: Array<{ id: string; name: string }>;
  teamMembers: Array<{ id: string; full_name: string; email: string }>;
  allLabels: Array<{ label_name: string; label_color: string }>;
  savedSearches: Array<{ id: string; name: string; filters: AdvancedSearchFilters }>;
  onSaveSearch: (name: string, filters: AdvancedSearchFilters) => void;
  onLoadSearch: (filters: AdvancedSearchFilters) => void;
  onDeleteSearch: (id: string) => void;
}

export const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  filters,
  onFiltersChange,
  projects,
  teamMembers,
  allLabels,
  savedSearches,
  onSaveSearch,
  onLoadSearch,
  onDeleteSearch,
}) => {
  const [searchName, setSearchName] = useState('');
  const { toast } = useToast();

  const updateFilters = (updates: Partial<AdvancedSearchFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: '',
      searchFields: ['title', 'description'],
      selectedProject: 'all',
      selectedStatus: [],
      selectedPriority: [],
      selectedLabels: [],
      selectedAssignee: 'all',
      dueDateFrom: undefined,
      dueDateTo: undefined,
      createdDateFrom: undefined,
      createdDateTo: undefined,
      hasTimeLogged: null,
      isOverdue: null,
      quickFilters: [],
    });
  };

  const toggleArrayFilter = (array: string[], value: string) => {
    if (array.includes(value)) {
      return array.filter(item => item !== value);
    } else {
      return [...array, value];
    }
  };

  const addQuickFilter = (filterType: string) => {
    const newQuickFilters = toggleArrayFilter(filters.quickFilters, filterType);
    updateFilters({ quickFilters: newQuickFilters });
  };

  const handleSaveSearch = () => {
    if (!searchName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for the search',
        variant: 'destructive',
      });
      return;
    }
    
    onSaveSearch(searchName.trim(), filters);
    setSearchName('');
    toast({ title: 'Search saved successfully' });
  };

  const quickFilterOptions = [
    { id: 'my_tasks', label: 'My Tasks', icon: User },
    { id: 'overdue', label: 'Overdue', icon: Clock },
    { id: 'due_today', label: 'Due Today', icon: Calendar },
    { id: 'due_this_week', label: 'Due This Week', icon: Calendar },
    { id: 'no_assignee', label: 'Unassigned', icon: User },
    { id: 'has_time_logged', label: 'Has Time Logged', icon: Clock },
  ];

  const searchFieldOptions = [
    { id: 'title', label: 'Title' },
    { id: 'description', label: 'Description' },
    { id: 'comments', label: 'Comments' },
  ];

  const statusOptions = [
    { id: 'todo', label: 'To Do' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'review', label: 'Review' },
    { id: 'completed', label: 'Completed' },
    { id: 'blocked', label: 'Blocked' },
  ];

  const priorityOptions = [
    { id: 'low', label: 'Low' },
    { id: 'medium', label: 'Medium' },
    { id: 'high', label: 'High' },
    { id: 'critical', label: 'Critical' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Search & Filters
          </CardTitle>
          
          <div className="flex gap-2">
            {/* Saved Searches */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Bookmark className="h-4 w-4 mr-2" />
                  Saved Searches
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-3">
                  <h4 className="font-medium">Saved Searches</h4>
                  {savedSearches.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No saved searches</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {savedSearches.map((search) => (
                        <div key={search.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-0 h-auto font-normal text-left flex-1"
                            onClick={() => onLoadSearch(search.filters)}
                          >
                            {search.name}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => onDeleteSearch(search.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Separator />
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="w-full">
                        <Save className="h-4 w-4 mr-2" />
                        Save Current Search
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Save Search</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="searchName">Search Name</Label>
                          <Input
                            id="searchName"
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            placeholder="Enter a name for this search..."
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setSearchName('')}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveSearch}>
                            Save Search
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quick Filters */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Quick Filters</Label>
          <div className="flex flex-wrap gap-2">
            {quickFilterOptions.map((option) => {
              const Icon = option.icon;
              const isActive = filters.quickFilters.includes(option.id);
              return (
                <Button
                  key={option.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => addQuickFilter(option.id)}
                  className="gap-1"
                >
                  <Icon className="h-3 w-3" />
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Search Term and Fields */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Search Text</Label>
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={filters.searchTerm}
                onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-4">
              <Label className="text-xs text-muted-foreground">Search in:</Label>
              {searchFieldOptions.map((field) => (
                <div key={field.id} className="flex items-center space-x-1">
                  <Checkbox
                    id={field.id}
                    checked={filters.searchFields.includes(field.id)}
                    onCheckedChange={(checked) => {
                      const newFields = checked
                        ? [...filters.searchFields, field.id]
                        : filters.searchFields.filter(f => f !== field.id);
                      updateFilters({ searchFields: newFields });
                    }}
                  />
                  <Label htmlFor={field.id} className="text-xs">{field.label}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Project Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Project</Label>
            <Select value={filters.selectedProject} onValueChange={(value) => updateFilters({ selectedProject: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignee Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Assignee</Label>
            <Select value={filters.selectedAssignee} onValueChange={(value) => updateFilters({ selectedAssignee: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Assignees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name || member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date Range */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Due Date Range</Label>
            <div className="flex gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    {filters.dueDateFrom ? format(filters.dueDateFrom, 'MMM d') : 'From'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={filters.dueDateFrom}
                    onSelect={(date) => updateFilters({ dueDateFrom: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    {filters.dueDateTo ? format(filters.dueDateTo, 'MMM d') : 'To'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={filters.dueDateTo}
                    onSelect={(date) => updateFilters({ dueDateTo: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <Separator />

        {/* Multi-select Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Multi-Select */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Status</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {filters.selectedStatus.length === 0 ? 'All Status' : `${filters.selectedStatus.length} selected`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3">
                <div className="space-y-2">
                  {statusOptions.map((status) => (
                    <div key={status.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={status.id}
                        checked={filters.selectedStatus.includes(status.id)}
                        onCheckedChange={(checked) => {
                          const newStatus = checked
                            ? [...filters.selectedStatus, status.id]
                            : filters.selectedStatus.filter(s => s !== status.id);
                          updateFilters({ selectedStatus: newStatus });
                        }}
                      />
                      <Label htmlFor={status.id} className="text-sm">{status.label}</Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Priority Multi-Select */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Priority</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {filters.selectedPriority.length === 0 ? 'All Priority' : `${filters.selectedPriority.length} selected`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3">
                <div className="space-y-2">
                  {priorityOptions.map((priority) => (
                    <div key={priority.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={priority.id}
                        checked={filters.selectedPriority.includes(priority.id)}
                        onCheckedChange={(checked) => {
                          const newPriority = checked
                            ? [...filters.selectedPriority, priority.id]
                            : filters.selectedPriority.filter(p => p !== priority.id);
                          updateFilters({ selectedPriority: newPriority });
                        }}
                      />
                      <Label htmlFor={priority.id} className="text-sm">{priority.label}</Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Labels Multi-Select */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Labels</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Tag className="h-4 w-4 mr-2" />
                  {filters.selectedLabels.length === 0 ? 'All Labels' : `${filters.selectedLabels.length} selected`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {allLabels.map((label) => (
                    <div key={label.label_name} className="flex items-center space-x-2">
                      <Checkbox
                        id={label.label_name}
                        checked={filters.selectedLabels.includes(label.label_name)}
                        onCheckedChange={(checked) => {
                          const newLabels = checked
                            ? [...filters.selectedLabels, label.label_name]
                            : filters.selectedLabels.filter(l => l !== label.label_name);
                          updateFilters({ selectedLabels: newLabels });
                        }}
                      />
                      <Label htmlFor={label.label_name} className="text-sm flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: label.label_color }}
                        />
                        {label.label_name}
                      </Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.selectedStatus.length > 0 || filters.selectedPriority.length > 0 || filters.selectedLabels.length > 0 || filters.quickFilters.length > 0) && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-medium">Active Filters:</Label>
              <div className="flex flex-wrap gap-2">
                {filters.quickFilters.map((filter) => {
                  const option = quickFilterOptions.find(o => o.id === filter);
                  if (!option) return null;
                  return (
                    <Badge key={filter} variant="secondary" className="gap-1">
                      {option.label}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-3 w-3 p-0 ml-1"
                        onClick={() => addQuickFilter(filter)}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  );
                })}
                
                {filters.selectedStatus.map((status) => (
                  <Badge key={status} variant="outline" className="gap-1">
                    Status: {statusOptions.find(s => s.id === status)?.label}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-3 w-3 p-0 ml-1"
                      onClick={() => updateFilters({ 
                        selectedStatus: filters.selectedStatus.filter(s => s !== status) 
                      })}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                ))}
                
                {filters.selectedPriority.map((priority) => (
                  <Badge key={priority} variant="outline" className="gap-1">
                    Priority: {priorityOptions.find(p => p.id === priority)?.label}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-3 w-3 p-0 ml-1"
                      onClick={() => updateFilters({ 
                        selectedPriority: filters.selectedPriority.filter(p => p !== priority) 
                      })}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                ))}
                
                {filters.selectedLabels.map((label) => {
                  const labelData = allLabels.find(l => l.label_name === label);
                  return (
                    <Badge 
                      key={label} 
                      variant="outline" 
                      className="gap-1"
                      style={{ borderColor: labelData?.label_color, color: labelData?.label_color }}
                    >
                      <Tag className="h-3 w-3" />
                      {label}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-3 w-3 p-0 ml-1"
                        onClick={() => updateFilters({ 
                          selectedLabels: filters.selectedLabels.filter(l => l !== label) 
                        })}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};