export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  settings?: Record<string, any>;
  isVisible: boolean;
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
  layout: 'grid' | 'list';
  columns: number;
}

export interface DashboardPreferences {
  layout: DashboardLayout;
  defaultWidgets: string[];
  theme?: string;
}

export type WidgetType = 
  | 'forms-submissions-summary'
  | 'popular-forms'
  | 'form-analytics'
  | 'recent-form-activity'
  | 'pending-approvals'
  | 'approval-activity-feed'
  | 'approval-analytics'
  | 'my-approvals-status'
  | 'workflow-status'
  | 'forms-approvals-calendar'
  | 'project-stats'
  | 'task-summary'
  | 'weather-widget'
  | 'calendar-preview'
  | 'file-overview';

export interface WidgetConfig {
  type: WidgetType;
  title: string;
  description: string;
  defaultSize: {
    width: number;
    height: number;
  };
  minSize: {
    width: number;
    height: number;
  };
  settings?: {
    timeRange?: number;
    showChart?: boolean;
    maxItems?: number;
  };
}