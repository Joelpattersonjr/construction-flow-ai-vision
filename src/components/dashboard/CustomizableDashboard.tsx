import React, { useState, useCallback } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Settings, RotateCcw } from 'lucide-react';
import { DashboardWidget } from './DashboardWidget';
import { SortableDashboardWidget } from './SortableDashboardWidget';
import { WidgetSelector } from './WidgetSelector';
import { DashboardSettings } from './DashboardSettings';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { WIDGET_REGISTRY, WIDGET_CONFIGS } from './widgets';
import { DashboardWidget as WidgetType, WidgetType as WidgetTypeEnum } from '@/types/dashboard';
import { toast } from 'sonner';

export const CustomizableDashboard: React.FC = () => {
  const { preferences, updatePreferences, loading } = useUserPreferences();
  const [isEditing, setIsEditing] = useState(false);
  const [activeWidget, setActiveWidget] = useState<WidgetType | null>(null);
  const [showWidgetSelector, setShowWidgetSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Show loading state while preferences are being loaded
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-muted rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // Get dashboard preferences or use defaults
  const dashboardConfig = preferences.dashboard || {
    widgets: [
      {
        id: '1',
        type: 'forms-submissions-summary',
        title: 'Forms Summary',
        position: { x: 0, y: 0 },
        size: { width: 300, height: 200 },
        isVisible: true
      },
      {
        id: '2',
        type: 'pending-approvals',
        title: 'Pending Approvals',
        position: { x: 1, y: 0 },
        size: { width: 300, height: 250 },
        isVisible: true
      },
      {
        id: '3',
        type: 'popular-forms',
        title: 'Popular Forms',
        position: { x: 2, y: 0 },
        size: { width: 300, height: 250 },
        isVisible: true
      }
    ],
    layout: 'grid' as const,
    columns: 3
  };

  const visibleWidgets = dashboardConfig.widgets.filter(w => w.isVisible);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const widget = visibleWidgets.find(w => w.id === event.active.id);
    setActiveWidget(widget || null);
  }, [visibleWidgets]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveWidget(null);

    if (!over || active.id === over.id) return;

    const activeIndex = visibleWidgets.findIndex(w => w.id === active.id);
    const overIndex = visibleWidgets.findIndex(w => w.id === over.id);

    if (activeIndex === -1 || overIndex === -1) return;

    const newWidgets = [...dashboardConfig.widgets];
    const activeWidget = newWidgets.find(w => w.id === active.id);
    const overWidget = newWidgets.find(w => w.id === over.id);

    if (activeWidget && overWidget) {
      // Swap positions
      const tempPosition = { ...activeWidget.position };
      activeWidget.position = { ...overWidget.position };
      overWidget.position = tempPosition;

      updateDashboardConfig({ widgets: newWidgets });
    }
  }, [visibleWidgets, dashboardConfig.widgets, updatePreferences]);

  const updateDashboardConfig = useCallback(async (updates: Partial<typeof dashboardConfig>) => {
    try {
      await updatePreferences({
        dashboard: { ...dashboardConfig, ...updates }
      });
    } catch (error) {
      console.error('Failed to update dashboard:', error);
      toast.error('Failed to update dashboard');
    }
  }, [dashboardConfig, updatePreferences]);

  const handleAddWidget = useCallback((widgetType: WidgetTypeEnum) => {
    const config = WIDGET_CONFIGS[widgetType];
    const newWidget: WidgetType = {
      id: `widget-${Date.now()}`,
      type: widgetType,
      title: config.title,
      position: { x: visibleWidgets.length % dashboardConfig.columns, y: Math.floor(visibleWidgets.length / dashboardConfig.columns) },
      size: config.defaultSize,
      isVisible: true
    };

    updateDashboardConfig({
      widgets: [...dashboardConfig.widgets, newWidget]
    });
    setShowWidgetSelector(false);
    toast.success('Widget added successfully');
  }, [visibleWidgets.length, dashboardConfig, updateDashboardConfig]);

  const handleRemoveWidget = useCallback((widgetId: string) => {
    const newWidgets = dashboardConfig.widgets.filter(w => w.id !== widgetId);
    updateDashboardConfig({ widgets: newWidgets });
    toast.success('Widget removed');
  }, [dashboardConfig.widgets, updateDashboardConfig]);

  const handleResizeWidget = useCallback((widgetId: string, width: number, height: number) => {
    const newWidgets = dashboardConfig.widgets.map(w => 
      w.id === widgetId 
        ? { ...w, size: { width: Math.max(width, 200), height: Math.max(height, 150) } }
        : w
    );
    updateDashboardConfig({ widgets: newWidgets });
  }, [dashboardConfig.widgets, updateDashboardConfig]);

  const handleResetLayout = useCallback(() => {
    updateDashboardConfig({
      widgets: [
        {
          id: '1',
          type: 'forms-submissions-summary',
          title: 'Forms Summary',
          position: { x: 0, y: 0 },
          size: { width: 300, height: 200 },
          isVisible: true
        },
        {
          id: '2',
          type: 'pending-approvals',
          title: 'Pending Approvals',
          position: { x: 1, y: 0 },
          size: { width: 300, height: 250 },
          isVisible: true
        },
        {
          id: '3',
          type: 'popular-forms',
          title: 'Popular Forms',
          position: { x: 2, y: 0 },
          size: { width: 300, height: 250 },
          isVisible: true
        }
      ]
    });
    toast.success('Layout reset to default');
  }, [updateDashboardConfig]);

  const renderWidget = (widget: WidgetType) => {
    const WidgetComponent = WIDGET_REGISTRY[widget.type as WidgetTypeEnum];
    if (!WidgetComponent) return <div>Widget not found: {widget.type}</div>;
    return <WidgetComponent />;
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Customize your workspace</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={() => setIsEditing(!isEditing)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {isEditing ? 'Done Editing' : 'Edit Layout'}
          </Button>
          
          {isEditing && (
            <>
              <Dialog open={showWidgetSelector} onOpenChange={setShowWidgetSelector}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Widget
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Widget</DialogTitle>
                  </DialogHeader>
                  <WidgetSelector onSelect={handleAddWidget} />
                </DialogContent>
              </Dialog>

              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Dashboard Settings</DialogTitle>
                  </DialogHeader>
                  <DashboardSettings 
                    config={dashboardConfig}
                    onUpdate={updateDashboardConfig}
                  />
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={handleResetLayout}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Dashboard Grid */}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext 
          items={visibleWidgets.map(w => w.id)}
          strategy={rectSortingStrategy}
        >
          <div 
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${dashboardConfig.columns}, minmax(250px, 1fr))`
            }}
          >
            {visibleWidgets.map(widget => (
              <SortableDashboardWidget
                key={widget.id}
                widget={widget}
                isEditing={isEditing}
                onRemove={() => handleRemoveWidget(widget.id)}
                onResize={(width, height) => handleResizeWidget(widget.id, width, height)}
              >
                {renderWidget(widget)}
              </SortableDashboardWidget>
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeWidget ? (
            <DashboardWidget
              widget={activeWidget}
              isDragging
            >
              {renderWidget(activeWidget)}
            </DashboardWidget>
          ) : null}
        </DragOverlay>
      </DndContext>

      {visibleWidgets.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No widgets configured</h3>
          <p className="text-muted-foreground mb-4">
            Add widgets to customize your dashboard
          </p>
          <Button onClick={() => setShowWidgetSelector(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Widget
          </Button>
        </div>
      )}
    </div>
  );
};