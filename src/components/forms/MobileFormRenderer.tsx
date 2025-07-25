import React from 'react';
import { Capacitor } from '@capacitor/core';
import { FormRenderer, FormRendererProps } from './FormRenderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone } from 'lucide-react';

interface MobileFormRendererProps extends FormRendererProps {
  showMobileBadge?: boolean;
}

export const MobileFormRenderer: React.FC<MobileFormRendererProps> = ({
  showMobileBadge = true,
  ...props
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
          {...props}
          // Mobile-specific optimizations can be added here
        />
      </div>
    </div>
  );
};