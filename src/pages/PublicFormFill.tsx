import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export const PublicFormFill: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();

  const { data: formTemplate, isLoading, error } = useQuery({
    queryKey: ['public-form-template', formId],
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
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
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-96">
          <CardContent className="text-center p-8">
            <h2 className="text-lg font-semibold mb-2">Form Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The form you're looking for doesn't exist or is no longer available.
            </p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
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
          projectId={undefined} // No project context for public forms
          onSubmit={async (data) => {
            try {
              const { error } = await supabase
                .from('form_submissions')
                .insert({
                  form_template_id: formTemplate.id,
                  submission_data: data,
                  submitted_by: null, // Anonymous submission
                  status: 'submitted',
                });

              if (error) throw error;
              
              alert('Form submitted successfully! Thank you for your submission.');
            } catch (error) {
              console.error('Error submitting form:', error);
              alert('There was an error submitting the form. Please try again.');
            }
          }}
          onSaveDraft={(data) => {
            // Save to localStorage for public forms
            localStorage.setItem(`form_draft_${formTemplate.id}`, JSON.stringify(data));
            alert('Draft saved locally!');
          }}
        />
      </div>
    </div>
  );
};