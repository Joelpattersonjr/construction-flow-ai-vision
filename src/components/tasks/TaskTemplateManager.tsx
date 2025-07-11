import React, { useState } from 'react';
import { Plus, FileText, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { taskTemplatesService, TaskTemplate } from '@/services/taskTemplatesService';
import { TaskPriority } from '@/types/tasks';

interface TaskTemplateManagerProps {
  onUseTemplate: (template: TaskTemplate) => void;
}

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export const TaskTemplateManager: React.FC<TaskTemplateManagerProps> = ({ onUseTemplate }) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    title_template: '',
    description_template: '',
    priority: 'medium' as TaskPriority,
    estimated_hours: '',
    tags: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ['task-templates'],
    queryFn: () => taskTemplatesService.getCompanyTemplates(),
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (templateData: any) => taskTemplatesService.createTemplate({
      ...templateData,
      estimated_hours: templateData.estimated_hours ? parseInt(templateData.estimated_hours) : null,
      tags: templateData.tags ? templateData.tags.split(',').map((tag: string) => tag.trim()) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      toast({ title: 'Template created successfully!' });
      setIsCreateDialogOpen(false);
      setNewTemplate({
        name: '',
        title_template: '',
        description_template: '',
        priority: 'medium',
        estimated_hours: '',
        tags: '',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating template',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => taskTemplatesService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      toast({ title: 'Template deleted successfully!' });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting template',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.title_template.trim()) {
      toast({
        title: 'Please fill in required fields',
        description: 'Name and title template are required.',
        variant: 'destructive',
      });
      return;
    }

    await createTemplateMutation.mutateAsync(newTemplate);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplateMutation.mutateAsync(id);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Task Templates</DialogTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Task Template</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Template Name*</label>
                    <Input
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Bug Fix Template"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Title Template*</label>
                    <Input
                      value={newTemplate.title_template}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, title_template: e.target.value }))}
                      placeholder="e.g., Fix: [Bug Description]"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Description Template</label>
                    <Textarea
                      value={newTemplate.description_template}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, description_template: e.target.value }))}
                      placeholder="e.g., Steps to reproduce:&#10;1. [Step 1]&#10;2. [Step 2]&#10;&#10;Expected behavior:&#10;[Description]"
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Default Priority</label>
                      <Select value={newTemplate.priority} onValueChange={(value) => setNewTemplate(prev => ({ ...prev, priority: value as TaskPriority }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Estimated Hours</label>
                      <Input
                        type="number"
                        value={newTemplate.estimated_hours}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, estimated_hours: e.target.value }))}
                        placeholder="8"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Tags (comma-separated)</label>
                    <Input
                      value={newTemplate.tags}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="bug, frontend, urgent"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTemplate} disabled={createTemplateMutation.isPending}>
                      Create Template
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </DialogHeader>
        
        <div className="grid gap-4 mt-4">
          {templates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No templates found</p>
                <p className="text-sm text-muted-foreground">Create your first template to get started</p>
              </CardContent>
            </Card>
          ) : (
            templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => onUseTemplate(template)}
                        className="h-8"
                      >
                        Use Template
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">Title: </span>
                      <span className="text-sm text-muted-foreground">{template.title_template}</span>
                    </div>
                    
                    {template.description_template && (
                      <div>
                        <span className="text-sm font-medium">Description: </span>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                          {template.description_template}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 flex-wrap">
                      {template.priority && (
                        <Badge variant="outline">
                          Priority: {template.priority}
                        </Badge>
                      )}
                      
                      {template.estimated_hours && (
                        <Badge variant="outline">
                          {template.estimated_hours}h estimated
                        </Badge>
                      )}
                      
                      {template.tags && template.tags.length > 0 && (
                        <div className="flex gap-1">
                          {template.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};