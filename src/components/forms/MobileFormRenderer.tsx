import React from 'react';
import { Capacitor } from '@capacitor/core';
import { FormRenderer } from './FormRenderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone } from 'lucide-react';

interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  form_schema: any;
  category?: string;
}

interface MobileFormRendererProps {
  formTemplate: FormTemplate;
  projectId?: string;
  onSubmit: (data: any) => void;
  onSaveDraft?: (data: any) => void;
  showMobileBadge?: boolean;
}

export const MobileFormRenderer: React.FC<MobileFormRendererProps> = ({
  showMobileBadge = true,
  formTemplate,
  projectId,
  onSubmit,
  onSaveDraft,
}) => {
  const isNativeMobile = Capacitor.isNativePlatform();

  return (
    <div className="min-h-screen bg-background">
      {showMobileBadge && (
        <div className="sticky top-0 z-50 bg-primary/10 border-b px-4 py-2">
          <div className="flex items-center justify-center gap-2">
            <Smartphone className="h-4 w-4" />
            <span className="text-sm font-medium">
              {isNativeMobile ? 'Mobile App' : 'Mobile Optimized'}
            </span>
            {isNativeMobile && (
              <Badge variant="secondary" className="text-xs">
                Native
              </Badge>
            )}
          </div>
        </div>
      )}
      
      <div className="p-4">
        <FormRenderer
          formTemplate={{
            ...formTemplate,
            category: formTemplate.category || 'general'
          }}
          projectId={projectId}
          onSubmit={onSubmit}
          onSaveDraft={onSaveDraft}
        />
      </div>
    </div>
  );
};