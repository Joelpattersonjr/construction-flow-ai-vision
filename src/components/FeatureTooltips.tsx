import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Info, Lightbulb, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureTooltipProps {
  title: string;
  description: string;
  children: React.ReactNode;
  icon?: 'info' | 'help' | 'lightbulb' | 'sparkles';
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const iconMap = {
  info: Info,
  help: HelpCircle,
  lightbulb: Lightbulb,
  sparkles: Sparkles
};

export function FeatureTooltip({ 
  title, 
  description, 
  children, 
  icon = 'info',
  position = 'top',
  className 
}: FeatureTooltipProps) {
  const IconComponent = iconMap[icon];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("relative group cursor-help", className)}>
            {children}
            <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <IconComponent className="w-3 h-3 text-primary" />
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side={position}
          className="max-w-xs p-4 bg-popover border border-border shadow-lg"
          sideOffset={8}
        >
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Pre-configured tooltip components for common use cases
export function TaskManagementTooltip({ children }: { children: React.ReactNode }) {
  return (
    <FeatureTooltip
      title="Advanced Task Management"
      description="Create, assign, and track tasks with deadlines, priorities, and dependencies. Use our Kanban boards and Gantt charts for visual project planning."
      icon="sparkles"
    >
      {children}
    </FeatureTooltip>
  );
}

export function CollaborationTooltip({ children }: { children: React.ReactNode }) {
  return (
    <FeatureTooltip
      title="Real-time Collaboration"
      description="Work together seamlessly with live document editing, instant notifications, and team chat. See what your teammates are working on in real-time."
      icon="lightbulb"
    >
      {children}
    </FeatureTooltip>
  );
}

export function AnalyticsTooltip({ children }: { children: React.ReactNode }) {
  return (
    <FeatureTooltip
      title="Advanced Analytics"
      description="Get insights into your team's productivity with detailed reports, time tracking, and performance metrics. Make data-driven decisions."
      icon="info"
    >
      {children}
    </FeatureTooltip>
  );
}

export function SecurityTooltip({ children }: { children: React.ReactNode }) {
  return (
    <FeatureTooltip
      title="Enterprise Security"
      description="Your data is protected with enterprise-grade security, including encryption, SSO, role-based access control, and compliance certifications."
      icon="help"
      position="bottom"
    >
      {children}
    </FeatureTooltip>
  );
}

export function IntegrationsTooltip({ children }: { children: React.ReactNode }) {
  return (
    <FeatureTooltip
      title="Seamless Integrations"
      description="Connect with your favorite tools including Slack, GitHub, Google Drive, and 100+ other apps. Automate workflows with our API and Zapier integration."
      icon="sparkles"
      position="bottom"
    >
      {children}
    </FeatureTooltip>
  );
}

export function MobileTooltip({ children }: { children: React.ReactNode }) {
  return (
    <FeatureTooltip
      title="Mobile Optimized"
      description="Access your projects anywhere with our responsive web app and native mobile applications. Stay productive on the go with offline sync."
      icon="lightbulb"
      position="bottom"
    >
      {children}
    </FeatureTooltip>
  );
}