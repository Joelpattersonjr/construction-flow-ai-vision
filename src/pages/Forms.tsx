import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { FormTemplatesList } from "@/components/forms/FormTemplatesList";
import { FormBuilder } from "@/components/forms/FormBuilder";
import { FormSubmissions } from "@/components/forms/FormSubmissions";
import { WorkflowBuilder } from "@/components/forms/WorkflowBuilder";
import { AIFormTemplateGenerator } from "@/components/forms/AIFormTemplateGenerator";

const Forms: React.FC = () => {
  const [activeTab, setActiveTab] = useState("templates");
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  const handleCreateNewForm = () => {
    setEditingFormId(null);
    setShowFormBuilder(true);
  };

  const handleEditForm = (formId: string) => {
    setEditingFormId(formId);
    setShowFormBuilder(true);
  };

  const handleCloseBuilder = () => {
    setShowFormBuilder(false);
    setEditingFormId(null);
  };

  const handleAITemplateGenerated = (templateId: string) => {
    setEditingFormId(templateId);
    setShowFormBuilder(true);
    setShowAIGenerator(false);
  };

  if (showFormBuilder) {
    return (
      <div className="min-h-screen bg-background">
        <FormBuilder 
          formId={editingFormId} 
          onClose={handleCloseBuilder}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dynamic Forms</h1>
            <p className="text-muted-foreground">
              Create, manage, and automate custom forms and workflows for your construction projects
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setShowAIGenerator(true)} 
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80"
            >
              <Plus className="h-4 w-4" />
              Generate with AI
            </Button>
            <Button 
              onClick={handleCreateNewForm} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Form
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="templates">Form Templates</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <FormTemplatesList 
              onEditForm={handleEditForm}
              onCreateForm={handleCreateNewForm}
            />
          </TabsContent>

          <TabsContent value="submissions" className="space-y-4">
            <FormSubmissions />
          </TabsContent>

          <TabsContent value="workflows" className="space-y-4">
            <WorkflowBuilder />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">Analytics Coming Soon</h3>
              <p className="text-muted-foreground">
                Form submission analytics and reporting will be available in the next update.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Template Generator */}
      {showAIGenerator && (
        <AIFormTemplateGenerator
          onTemplateGenerated={handleAITemplateGenerated}
          onClose={() => setShowAIGenerator(false)}
        />
      )}
    </div>
  );
};

export default Forms;