import React from 'react';
import { Capacitor } from '@capacitor/core';
import { FormRenderer } from './FormRenderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Smartphone, Wifi, WifiOff, Download, Upload, Trash2 } from 'lucide-react';
import { useOfflineFormStorage } from '@/hooks/useOfflineFormStorage';

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
  const {
    isOffline,
    saveFormOffline,
    getPendingForms,
    deleteOfflineForm,
    getStorageInfo
  } = useOfflineFormStorage();

  const handleOfflineSubmit = (data: any) => {
    if (isOffline || !navigator.onLine) {
      saveFormOffline(formTemplate.id, formTemplate.name, data);
      return;
    }
    onSubmit(data);
  };

  const pendingForms = getPendingForms();
  const storageInfo = getStorageInfo();

  return (
    <div className="min-h-screen bg-background">
      {showMobileBadge && (
        <div className="sticky top-0 z-50 bg-primary/10 border-b px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
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
            
            <div className="flex items-center gap-2">
              {isOffline ? (
                <div className="flex items-center gap-1 text-orange-500">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-xs">Offline</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-green-500">
                  <Wifi className="h-4 w-4" />
                  <span className="text-xs">Online</span>
                </div>
              )}
              
              {pendingForms.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {pendingForms.length} pending
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Offline Forms Management */}
      {isNativeMobile && pendingForms.length > 0 && (
        <div className="p-4 bg-orange-50 border-b">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Download className="h-4 w-4" />
                Offline Forms ({pendingForms.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingForms.slice(0, 3).map((form) => (
                <div key={form.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{form.formName}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteOfflineForm(form.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {pendingForms.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{pendingForms.length - 3} more forms
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      <div className="p-4">
        <FormRenderer
          formTemplate={{
            ...formTemplate,
            category: formTemplate.category || 'general'
          }}
          projectId={projectId}
          onSubmit={handleOfflineSubmit}
          onSaveDraft={onSaveDraft}
        />
      </div>

      {/* Storage Info for Native Apps */}
      {isNativeMobile && (
        <div className="p-4 border-t bg-muted/50">
          <div className="text-xs text-muted-foreground text-center">
            Storage: {storageInfo.storageSizeKB}KB • {storageInfo.totalForms} forms stored locally
          </div>
        </div>
      )}
    </div>
  );
};