import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, X, Maximize2, Minimize2 } from 'lucide-react';
import { DashboardWidget as WidgetType } from '@/types/dashboard';

interface DashboardWidgetProps {
  widget: WidgetType;
  children: React.ReactNode;
  onSettings?: () => void;
  onRemove?: () => void;
  onResize?: (width: number, height: number) => void;
  isEditing?: boolean;
  isDragging?: boolean;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  widget,
  children,
  onSettings,
  onRemove,
  onResize,
  isEditing = false,
  isDragging = false
}) => {
  return (
    <Card 
      className={`
        relative transition-all duration-200 h-full
        ${isDragging ? 'opacity-50 scale-105 shadow-2xl z-50' : ''}
        ${isEditing ? 'ring-2 ring-primary/50' : ''}
        hover:shadow-md
      `}
      style={{
        width: widget.size.width,
        height: widget.size.height,
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        
        {isEditing && (
          <div className="flex items-center space-x-1">
            {onSettings && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSettings}
                className="h-8 w-8 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-4 pt-0 h-[calc(100%-60px)] overflow-auto">
        {children}
      </CardContent>
      
      {/* Resize handle */}
      {isEditing && onResize && (
        <div 
          className="absolute bottom-0 right-0 w-4 h-4 bg-primary/20 cursor-se-resize hover:bg-primary/40 transition-colors"
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = widget.size.width;
            const startHeight = widget.size.height;
            
            const handleMouseMove = (e: MouseEvent) => {
              const deltaX = e.clientX - startX;
              const deltaY = e.clientY - startY;
              onResize(startWidth + deltaX, startHeight + deltaY);
            };
            
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        >
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-primary/60"></div>
        </div>
      )}
    </Card>
  );
};