import React from 'react';

// Widget exports
export { FormsSubmissionsSummaryWidget } from './FormsSubmissionsSummaryWidget';
export { PendingApprovalsWidget } from './PendingApprovalsWidget';
export { PopularFormsWidget } from './PopularFormsWidget';
export { WeatherWidget } from './WeatherWidget';

// Widget registry for dynamic loading
import { FormsSubmissionsSummaryWidget } from './FormsSubmissionsSummaryWidget';
import { PendingApprovalsWidget } from './PendingApprovalsWidget';
import { PopularFormsWidget } from './PopularFormsWidget';
import { WeatherWidget } from './WeatherWidget';
import { WidgetType, WidgetConfig } from '@/types/dashboard';

const ComingSoonWidget: React.FC<{ title: string }> = ({ title }) => {
  return React.createElement('div', 
    { className: 'text-center py-4' },
    React.createElement('p', 
      { className: 'text-sm text-muted-foreground' }, 
      title
    ),
    React.createElement('p', 
      { className: 'text-xs text-muted-foreground mt-1' }, 
      'Coming Soon'
    )
  );
};

export const WIDGET_REGISTRY: Record<WidgetType, React.ComponentType> = {
  'forms-submissions-summary': FormsSubmissionsSummaryWidget,
  'popular-forms': PopularFormsWidget,
  'form-analytics': () => React.createElement(ComingSoonWidget, { title: 'Form Analytics Widget' }),
  'recent-form-activity': () => React.createElement(ComingSoonWidget, { title: 'Recent Form Activity Widget' }),
  'pending-approvals': PendingApprovalsWidget,
  'approval-activity-feed': () => React.createElement(ComingSoonWidget, { title: 'Approval Activity Feed Widget' }),
  'approval-analytics': () => React.createElement(ComingSoonWidget, { title: 'Approval Analytics Widget' }),
  'my-approvals-status': () => React.createElement(ComingSoonWidget, { title: 'My Approvals Status Widget' }),
  'workflow-status': () => React.createElement(ComingSoonWidget, { title: 'Workflow Status Widget' }),
  'forms-approvals-calendar': () => React.createElement(ComingSoonWidget, { title: 'Forms & Approvals Calendar Widget' }),
  'project-stats': () => React.createElement(ComingSoonWidget, { title: 'Project Stats Widget' }),
  'task-summary': () => React.createElement(ComingSoonWidget, { title: 'Task Summary Widget' }),
  'weather-widget': WeatherWidget,
  'calendar-preview': () => React.createElement(ComingSoonWidget, { title: 'Calendar Preview Widget' }),
  'file-overview': () => React.createElement(ComingSoonWidget, { title: 'File Overview Widget' }),
};

export const WIDGET_CONFIGS: Record<WidgetType, WidgetConfig> = {
  'forms-submissions-summary': {
    type: 'forms-submissions-summary',
    title: 'Forms Summary',
    description: 'Overview of form submissions and status',
    defaultSize: { width: 300, height: 200 },
    minSize: { width: 250, height: 150 }
  },
  'popular-forms': {
    type: 'popular-forms',
    title: 'Popular Forms',
    description: 'Most used form templates',
    defaultSize: { width: 300, height: 250 },
    minSize: { width: 250, height: 200 }
  },
  'form-analytics': {
    type: 'form-analytics',
    title: 'Form Analytics',
    description: 'Charts and metrics for form performance',
    defaultSize: { width: 400, height: 300 },
    minSize: { width: 350, height: 250 }
  },
  'recent-form-activity': {
    type: 'recent-form-activity',
    title: 'Recent Activity',
    description: 'Latest form submissions and actions',
    defaultSize: { width: 350, height: 250 },
    minSize: { width: 300, height: 200 }
  },
  'pending-approvals': {
    type: 'pending-approvals',
    title: 'Pending Approvals',
    description: 'Approvals waiting for your review',
    defaultSize: { width: 300, height: 250 },
    minSize: { width: 250, height: 200 }
  },
  'approval-activity-feed': {
    type: 'approval-activity-feed',
    title: 'Approval Activity',
    description: 'Recent approval decisions and actions',
    defaultSize: { width: 350, height: 300 },
    minSize: { width: 300, height: 250 }
  },
  'approval-analytics': {
    type: 'approval-analytics',
    title: 'Approval Analytics',
    description: 'Charts for approval times and patterns',
    defaultSize: { width: 400, height: 300 },
    minSize: { width: 350, height: 250 }
  },
  'my-approvals-status': {
    type: 'my-approvals-status',
    title: 'My Approvals',
    description: 'Your personal approval queue and status',
    defaultSize: { width: 300, height: 200 },
    minSize: { width: 250, height: 150 }
  },
  'workflow-status': {
    type: 'workflow-status',
    title: 'Workflow Status',
    description: 'Active workflows and their current steps',
    defaultSize: { width: 400, height: 250 },
    minSize: { width: 350, height: 200 }
  },
  'forms-approvals-calendar': {
    type: 'forms-approvals-calendar',
    title: 'Calendar',
    description: 'Due dates and deadlines for forms and approvals',
    defaultSize: { width: 450, height: 350 },
    minSize: { width: 400, height: 300 }
  },
  'project-stats': {
    type: 'project-stats',
    title: 'Project Overview',
    description: 'Quick stats for your projects',
    defaultSize: { width: 300, height: 150 },
    minSize: { width: 250, height: 100 }
  },
  'task-summary': {
    type: 'task-summary',
    title: 'Task Summary',
    description: 'Overview of tasks and their status',
    defaultSize: { width: 300, height: 200 },
    minSize: { width: 250, height: 150 }
  },
  'weather-widget': {
    type: 'weather-widget',
    title: 'Weather',
    description: 'Current weather conditions',
    defaultSize: { width: 250, height: 150 },
    minSize: { width: 200, height: 120 }
  },
  'calendar-preview': {
    type: 'calendar-preview',
    title: 'Calendar Preview',
    description: 'Upcoming events and deadlines',
    defaultSize: { width: 350, height: 300 },
    minSize: { width: 300, height: 250 }
  },
  'file-overview': {
    type: 'file-overview',
    title: 'File Overview',
    description: 'Recent files and storage stats',
    defaultSize: { width: 300, height: 200 },
    minSize: { width: 250, height: 150 }
  }
};