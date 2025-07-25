import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export const FormFill: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();

  const { data: formTemplate, isLoading, error } = useQuery({
    queryKey: ['form-template', formId],
    queryFn: async () => {
      if (!formId) throw new Error('Form ID is required');
      
      const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .eq('id', formId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!formId,
  });

  // Get a default project for task fetching (in a real app, this would be passed from context or URL)
  const { data: defaultProject } = useQuery({
    queryKey: ['default-project'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span>Loading form...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !formTemplate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="text-center p-8">
            <h2 className="text-lg font-semibold mb-2">Form Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The form you're looking for doesn't exist or is no longer available.
            </p>
            <Button onClick={() => navigate('/forms')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forms
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <FormRenderer
          formTemplate={{
            id: formTemplate.id,
            name: formTemplate.name,
            description: formTemplate.description,
            form_schema: formTemplate.form_schema as any,
            category: formTemplate.category,
          }}
          projectId={defaultProject?.id}
          onSubmit={(data) => {
            console.log('Form submitted:', data);
            navigate('/forms?tab=submissions');
          }}
          onSaveDraft={(data) => {
            console.log('Draft saved:', data);
          }}
        />
      </div>
    </div>
  );
};