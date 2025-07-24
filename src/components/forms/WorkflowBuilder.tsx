import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, GitBranch, Settings, Eye, Trash2, FileText, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { VisualWorkflowBuilder } from './VisualWorkflowBuilder';
import { AIWorkflowGenerator } from './AIWorkflowGenerator';
import { FormTemplateSelector } from './FormTemplateSelector';
import { WorkflowPreviewDialog } from './WorkflowPreviewDialog';

interface WorkflowTemplate {
  id: string;
  form_template_id: string;
  name: string;
  description: string;
  is_active: boolean;
  workflow_steps: any[];
  created_at: string;
  updated_at: string;
  form_templates: {
    name: string;
    category: string;
  };
  profiles: {
    full_name: string;
  };
}

export const WorkflowBuilder: React.FC = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<string | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedFormTemplate, setSelectedFormTemplate] = useState<{ id: string; name: string } | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewWorkflow, setPreviewWorkflow] = useState<any>(null);

  // Fetch available form templates
  const { data: formTemplates } = useQuery({
    queryKey: ['form-templates-for-workflows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_templates')
        .select('id, name, category')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: workflows, isLoading, refetch } = useQuery({
    queryKey: ['workflow-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_templates')
        .select(`
          *,
          form_templates(name, category),
          profiles(full_name)
        `)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as WorkflowTemplate[];
    },
  });

  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      const { error } = await supabase
        .from('workflow_templates')
        .update({ is_active: false })
        .eq('id', workflowId);

      if (error) throw error;

      toast.success('Workflow deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast.error('Failed to delete workflow');
    }
  };

  const renderWorkflowSteps = (steps: any[]) => {
    if (!steps || steps.length === 0) {
      return <span className="text-muted-foreground">No steps defined</span>;
    }

    return (
      <div className="flex items-center gap-2">
        {steps.slice(0, 3).map((step, index) => (
          <React.Fragment key={index}>
            <Badge variant="outline" className="text-xs">
              {step.name || `Step ${index + 1}`}
            </Badge>
            {index < Math.min(steps.length - 1, 2) && (
              <span className="text-muted-foreground">→</span>
            )}
          </React.Fragment>
        ))}
        {steps.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{steps.length - 3} more
          </Badge>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Approval Workflows</h3>
          <p className="text-sm text-muted-foreground">
            Create automated approval processes for your form submissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => {
              if (!formTemplates || formTemplates.length === 0) {
                toast.error('No form templates available. Create a form template first.');
                return;
              }
              setShowTemplateSelector(true);
            }}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            AI Generate
          </Button>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Workflow
          </Button>
        </div>
      </div>

      {!workflows || workflows.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No workflows created yet</h3>
            <p className="text-muted-foreground mb-4">
              Create approval workflows to automate your form review processes
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GitBranch className="h-5 w-5 text-primary" />
                      {workflow.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      For: {workflow.form_templates?.name}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {workflow.form_templates?.category?.replace('_', ' ')}
                  </Badge>
                </div>
                {workflow.description && (
                  <p className="text-sm text-muted-foreground">
                    {workflow.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Workflow Steps:</h4>
                  {renderWorkflowSteps(workflow.workflow_steps)}
                </div>

                <div className="text-xs text-muted-foreground">
                  <p>Created by {workflow.profiles?.full_name}</p>
                  <p>Updated {formatDistanceToNow(new Date(workflow.updated_at))} ago</p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingWorkflow(workflow.id)}
                    className="flex-1"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <button
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 relative z-50"
                    style={{ position: 'relative', zIndex: 9999 }}
                    type="button"
                    onMouseDown={() => console.log('🔍 MOUSEDOWN detected!')}
                    onMouseUp={() => console.log('🔍 MOUSEUP detected!')}
                    onClick={(e) => {
                      console.log('🔍 RAW BUTTON CLICKED!', e);
                      alert('BUTTON CLICKED! Check console for details.');
                      e.preventDefault();
                      e.stopPropagation();
                      setPreviewWorkflow(workflow);
                      setShowPreviewDialog(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteWorkflow(workflow.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Workflow Builder Dialog */}
      <Dialog open={showCreateDialog || !!editingWorkflow} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingWorkflow(null);
        }
      }}>
        <DialogContent className="max-w-screen-xl h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>
              {editingWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
            </DialogTitle>
          </DialogHeader>
          <VisualWorkflowBuilder
            workflowId={editingWorkflow || undefined}
            onSave={async (workflowData) => {
              try {
                if (editingWorkflow) {
                  const { error } = await supabase
                    .from('workflow_templates')
                    .update(workflowData)
                    .eq('id', editingWorkflow);
                  if (error) throw error;
                  toast.success('Workflow updated successfully');
                } else {
                  const { error } = await supabase
                    .from('workflow_templates')
                    .insert({
                      ...workflowData,
                      created_by: (await supabase.auth.getUser()).data.user?.id,
                      company_id: 1, // TODO: Get actual company ID
                    });
                  if (error) throw error;
                  toast.success('Workflow created successfully');
                }
                setShowCreateDialog(false);
                setEditingWorkflow(null);
                refetch();
              } catch (error) {
                console.error('Error saving workflow:', error);
                toast.error('Failed to save workflow');
              }
            }}
            onCancel={() => {
              setShowCreateDialog(false);
              setEditingWorkflow(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* AI Workflow Generator */}
      {selectedFormTemplate && (
        <AIWorkflowGenerator
          formTemplateId={selectedFormTemplate.id}
          formTemplateName={selectedFormTemplate.name}
          isOpen={showAIGenerator}
          onClose={() => {
            setShowAIGenerator(false);
            setSelectedFormTemplate(null);
          }}
          onWorkflowGenerated={async (workflow) => {
            try {
              // Get current user's company ID
              const { data: profile } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', (await supabase.auth.getUser()).data.user?.id)
                .single();

              const { error } = await supabase
                .from('workflow_templates')
                .insert({
                  form_template_id: selectedFormTemplate.id,
                  name: workflow.name,
                  description: workflow.description,
                  workflow_steps: workflow.workflow_steps as any,
                  is_active: true,
                  created_by: (await supabase.auth.getUser()).data.user?.id,
                });

              if (error) throw error;
              
              toast.success('AI-generated workflow created successfully!');
              refetch();
              setShowAIGenerator(false);
              setSelectedFormTemplate(null);
            } catch (error) {
              console.error('Error saving AI workflow:', error);
              toast.error('Failed to save AI-generated workflow');
            }
          }}
        />
      )}

      {/* Form Template Selector */}
      <FormTemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        formTemplates={formTemplates || []}
        onSelectTemplate={(template) => {
          setSelectedFormTemplate(template);
          setShowAIGenerator(true);
        }}
      />

      {/* Workflow Preview Dialog */}
      <WorkflowPreviewDialog
        isOpen={showPreviewDialog}
        onClose={() => {
          setShowPreviewDialog(false);
          setPreviewWorkflow(null);
        }}
        workflow={previewWorkflow}
      />
    </div>
  );
};