import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/types/dashboard';

interface DashboardSettingsProps {
  config: DashboardLayout;
  onUpdate: (updates: Partial<DashboardLayout>) => void;
}

export const DashboardSettings: React.FC<DashboardSettingsProps> = ({
  config,
  onUpdate
}) => {
  const handleColumnChange = (columns: number[]) => {
    onUpdate({ columns: columns[0] });
  };

  const handleLayoutChange = (layout: 'grid' | 'list') => {
    onUpdate({ layout });
  };

  const handleWidgetVisibilityToggle = (widgetId: string, isVisible: boolean) => {
    const updatedWidgets = config.widgets.map(widget =>
      widget.id === widgetId ? { ...widget, isVisible } : widget
    );
    onUpdate({ widgets: updatedWidgets });
  };

  return (
    <div className="space-y-6">
      {/* Layout Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Layout Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Layout Type</Label>
            <Select value={config.layout} onValueChange={handleLayoutChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid Layout</SelectItem>
                <SelectItem value="list">List Layout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {config.layout === 'grid' && (
            <div className="space-y-2">
              <Label>Columns: {config.columns}</Label>
              <Slider
                value={[config.columns]}
                onValueChange={handleColumnChange}
                min={1}
                max={6}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Widget Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Widget Visibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {config.widgets.map(widget => (
            <div key={widget.id} className="flex items-center justify-between">
              <Label htmlFor={`widget-${widget.id}`} className="font-normal">
                {widget.title}
              </Label>
              <Switch
                id={`widget-${widget.id}`}
                checked={widget.isVisible}
                onCheckedChange={(checked) => 
                  handleWidgetVisibilityToggle(widget.id, checked)
                }
              />
            </div>
          ))}
          
          {config.widgets.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No widgets configured. Add some widgets to manage their visibility.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              const updatedWidgets = config.widgets.map(widget => ({
                ...widget,
                isVisible: true
              }));
              onUpdate({ widgets: updatedWidgets });
            }}
          >
            Show All Widgets
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              const updatedWidgets = config.widgets.map(widget => ({
                ...widget,
                isVisible: false
              }));
              onUpdate({ widgets: updatedWidgets });
            }}
          >
            Hide All Widgets
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};