import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TaskTemplate {
  id: string;
  name: string;
  description: string | null;
  title_template: string;
  description_template: string | null;
  priority: string;
  estimated_hours: number | null;
  tags: string[];
  created_by: string;
  created_at: string;
}

interface TaskTemplateDialogProps {
  onCreateFromTemplate: (template: TaskTemplate) => void;
  onClose: () => void;
}

export const TaskTemplateDialog: React.FC<TaskTemplateDialogProps> = ({
  onCreateFromTemplate,
  onClose,
}) => {
  const [open, setOpen] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    title_template: '',
    description_template: '',
    priority: 'medium',
    estimated_hours: '',
    tags: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['task-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as TaskTemplate[];
    },
    enabled: open,
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: typeof newTemplate) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('task_templates')
        .insert({
          company_id: profile.company_id,
          name: templateData.name,
          description: templateData.description || null,
          title_template: templateData.title_template,
          description_template: templateData.description_template || null,
          priority: templateData.priority,
          estimated_hours: templateData.estimated_hours ? parseInt(templateData.estimated_hours) : null,
          tags: templateData.tags ? templateData.tags.split(',').map(t => t.trim()) : [],
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      toast({ title: 'Template created successfully!' });
      setShowCreateForm(false);
      setNewTemplate({
        name: '',
        description: '',
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
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
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

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.title_template) {
      toast({
        title: 'Missing required fields',
        description: 'Name and title template are required',
        variant: 'destructive',
      });
      return;
    }

    createTemplateMutation.mutate(newTemplate);
  };

  const handleUseTemplate = (template: TaskTemplate) => {
    onCreateFromTemplate(template);
    onClose();
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplateMutation.mutate(id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      setOpen(open);
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Task Templates
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create new template button */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Create tasks quickly from predefined templates
            </p>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>

          {/* Create template form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Template Name *</label>
                    <Input
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="e.g., Bug Fix Template"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select
                      value={newTemplate.priority}
                      onValueChange={(value) => setNewTemplate({ ...newTemplate, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    placeholder="Template description"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Task Title Template *</label>
                  <Input
                    value={newTemplate.title_template}
                    onChange={(e) => setNewTemplate({ ...newTemplate, title_template: e.target.value })}
                    placeholder="e.g., Fix bug in {component}"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Task Description Template</label>
                  <Textarea
                    value={newTemplate.description_template}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description_template: e.target.value })}
                    placeholder="e.g., Steps to reproduce:\n1. \n2. \n\nExpected behavior:\n\nActual behavior:"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Estimated Hours</label>
                    <Input
                      type="number"
                      value={newTemplate.estimated_hours}
                      onChange={(e) => setNewTemplate({ ...newTemplate, estimated_hours: e.target.value })}
                      placeholder="Hours"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tags</label>
                    <Input
                      value={newTemplate.tags}
                      onChange={(e) => setNewTemplate({ ...newTemplate, tags: e.target.value })}
                      placeholder="bug, frontend, critical (comma separated)"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateTemplate}
                    disabled={createTemplateMutation.isPending}
                  >
                    Create Template
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Templates list */}
          {isLoading ? (
            <div className="text-center py-8">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No templates created yet. Create your first template above!
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {templates.map((template) => (
                <Card key={template.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        {template.description && (
                          <CardDescription className="mt-1">
                            {template.description}
                          </CardDescription>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Title Template:</p>
                      <p className="text-sm font-mono bg-muted p-2 rounded text-xs">
                        {template.title_template}
                      </p>
                    </div>

                    {template.description_template && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Description Template:</p>
                        <p className="text-sm font-mono bg-muted p-2 rounded text-xs whitespace-pre-wrap line-clamp-3">
                          {template.description_template}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Badge variant="outline">{template.priority}</Badge>
                        {template.estimated_hours && (
                          <Badge variant="secondary">{template.estimated_hours}h</Badge>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                      >
                        Use Template
                      </Button>
                    </div>

                    {template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};