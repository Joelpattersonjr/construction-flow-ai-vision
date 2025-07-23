import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Calendar, 
  Shield, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  Wand2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface AIFormTemplateGeneratorProps {
  onTemplateGenerated: (templateId: string) => void;
  onClose: () => void;
}

const predefinedTemplates = [
  {
    id: 'daily_report',
    name: 'Daily Report',
    description: 'Track daily progress, weather, workforce, and site conditions',
    icon: Calendar,
    color: 'bg-blue-100 text-blue-800',
    category: 'daily_log'
  },
  {
    id: 'safety_inspection',
    name: 'Safety Inspection',
    description: 'Comprehensive safety checklist and compliance verification',
    icon: Shield,
    color: 'bg-red-100 text-red-800',
    category: 'safety'
  },
  {
    id: 'rfi',
    name: 'Request for Information',
    description: 'Submit questions and requests to project stakeholders',
    icon: FileText,
    color: 'bg-green-100 text-green-800',
    category: 'rfi'
  },
  {
    id: 'incident_report',
    name: 'Incident Report',
    description: 'Document safety incidents and corrective actions',
    icon: AlertTriangle,
    color: 'bg-orange-100 text-orange-800',
    category: 'incident'
  },
  {
    id: 'quality_control',
    name: 'Quality Control',
    description: 'Quality inspection and compliance verification',
    icon: CheckCircle,
    color: 'bg-purple-100 text-purple-800',
    category: 'quality'
  }
];

export const AIFormTemplateGenerator: React.FC<AIFormTemplateGeneratorProps> = ({
  onTemplateGenerated,
  onClose,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customDescription, setCustomDescription] = useState('');
  const [formName, setFormName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');

  // Get current user profile for company_id
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleGenerateTemplate = async () => {
    if (!selectedTemplate && !customDescription.trim()) {
      toast.error('Please select a template type or provide a custom description');
      return;
    }

    if (!profile?.company_id) {
      toast.error('Company information not found');
      return;
    }

    setIsGenerating(true);
    setGenerationStep('Analyzing requirements...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      setGenerationStep('Generating form structure with AI...');

      const { data, error } = await supabase.functions.invoke('generate-form-template', {
        body: {
          formType: selectedTemplate,
          customDescription: customDescription,
          companyId: profile.company_id,
          userId: user.id
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate template');
      }

      setGenerationStep('Finalizing template...');

      toast.success(`Generated "${data.template.name}" successfully!`);
      onTemplateGenerated(data.template.id);
      onClose();

    } catch (error: any) {
      console.error('Error generating template:', error);
      toast.error(error.message || 'Failed to generate form template');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = predefinedTemplates.find(t => t.id === templateId);
    if (template) {
      setFormName(template.name);
      setCustomDescription(''); // Clear custom description when selecting predefined
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            AI Form Template Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Predefined Templates */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Choose a Template Type</Label>
              <p className="text-sm text-muted-foreground">
                Select a construction industry standard form or create a custom one
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {predefinedTemplates.map((template) => {
                const IconComponent = template.icon;
                const isSelected = selectedTemplate === template.id;

                return (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${template.color}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {template.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Custom Description */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Or Describe Your Custom Form</Label>
              <p className="text-sm text-muted-foreground">
                Describe what kind of form you need and AI will generate it for you
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="form-name">Form Name (Optional)</Label>
                <Input
                  id="form-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Weekly Equipment Inspection"
                />
              </div>

              <div>
                <Label htmlFor="custom-description">Description</Label>
                <Textarea
                  id="custom-description"
                  value={customDescription}
                  onChange={(e) => {
                    setCustomDescription(e.target.value);
                    if (e.target.value.trim()) {
                      setSelectedTemplate(''); // Clear selected template when typing custom
                    }
                  }}
                  placeholder="Describe the form you need... For example: 'Create a form for tracking material deliveries including supplier information, delivery time, quantities, quality checks, and supervisor approval.'"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Generation Progress */}
          {isGenerating && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div>
                    <p className="font-medium text-primary">Generating your form template...</p>
                    <p className="text-sm text-muted-foreground">{generationStep}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isGenerating}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateTemplate} 
              disabled={isGenerating || (!selectedTemplate && !customDescription.trim())}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate Template'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};