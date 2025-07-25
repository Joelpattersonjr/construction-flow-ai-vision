import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Trash2, Plus, FileText, Calendar, Shield, AlertTriangle, Share } from "lucide-react";
import { FormSharingDialog } from './FormSharingDialog';
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  form_schema: any;
  created_by: string;
  profiles: {
    full_name: string;
  };
}

interface FormTemplatesListProps {
  onEditForm: (formId: string) => void;
  onCreateForm: () => void;
}

const categoryIcons = {
  daily_log: Calendar,
  safety: Shield,
  rfi: FileText,
  incident: AlertTriangle,
  general: FileText,
};

const categoryColors = {
  daily_log: "bg-blue-100 text-blue-800",
  safety: "bg-red-100 text-red-800",
  rfi: "bg-green-100 text-green-800",
  incident: "bg-orange-100 text-orange-800",
  general: "bg-gray-100 text-gray-800",
};

export const FormTemplatesList: React.FC<FormTemplatesListProps> = ({
  onEditForm,
  onCreateForm,
}) => {
  const [sharingFormId, setSharingFormId] = useState<string | null>(null);
  const [sharingFormName, setSharingFormName] = useState<string>('');
  const { data: templates, isLoading, refetch } = useQuery({
    queryKey: ['form-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_templates')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as FormTemplate[];
    },
  });

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('form_templates')
        .update({ is_active: false })
        .eq('id', templateId);

      if (error) throw error;

      toast.success('Form template deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete form template');
    }
  };

  const defaultTemplates = [
    {
      name: "Daily Log Report",
      description: "Track daily progress, weather, and workforce information",
      category: "daily_log",
      icon: Calendar,
    },
    {
      name: "Safety Inspection",
      description: "Comprehensive safety checklist and incident reporting",
      category: "safety",
      icon: Shield,
    },
    {
      name: "Request for Information (RFI)",
      description: "Submit questions and requests to project stakeholders",
      category: "rfi",
      icon: FileText,
    },
    {
      name: "Incident Report",
      description: "Document safety incidents and corrective actions",
      category: "incident",
      icon: AlertTriangle,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
    <div className="space-y-10">
      {/* Quick Start Templates */}
      {(!templates || templates.length === 0) && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Quick Start Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {defaultTemplates.map((template) => {
              const IconComponent = template.icon;
              return (
                <Card key={template.name} className="cursor-pointer hover:shadow-md transition-shadow border-dashed">
                  <CardContent className="p-8 text-center">
                    <IconComponent className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                    <h4 className="font-medium mb-3">{template.name}</h4>
                    <p className="text-sm text-muted-foreground mb-6">
                      {template.description}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={onCreateForm}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Existing Templates */}
      {templates && templates.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Your Form Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => {
              const IconComponent = categoryIcons[template.category as keyof typeof categoryIcons] || FileText;
              const colorClass = categoryColors[template.category as keyof typeof categoryColors] || categoryColors.general;

              return (
                <Card key={template.id} className="hover:shadow-md transition-shadow h-full flex flex-col">
                  <CardHeader className="pb-4 flex-shrink-0">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <IconComponent className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                      </div>
                      <Badge variant="secondary" className={`${colorClass} flex-shrink-0 text-xs`}>
                        {template.category.replace('_', ' ')}
                      </Badge>
                    </div>
                    {template.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="truncate">Created by {template.profiles?.full_name}</p>
                      <p>Updated {formatDistanceToNow(new Date(template.updated_at))} ago</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditForm(template.id)}
                        className="w-full"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Navigate to form fill page
                          window.location.href = `/forms/fill/${template.id}`;
                        }}
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSharingFormId(template.id);
                          setSharingFormName(template.name);
                        }}
                        className="w-full"
                      >
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-destructive hover:text-destructive w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      
      <FormSharingDialog
        open={!!sharingFormId}
        onOpenChange={(open) => {
          if (!open) {
            setSharingFormId(null);
            setSharingFormName('');
          }
        }}
        formId={sharingFormId || ''}
        formName={sharingFormName}
      />
    </div>
  );
};
