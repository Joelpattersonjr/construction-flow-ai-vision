import React from 'react';
import { cn } from '@/lib/utils';

interface WeatherMobileLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const WeatherMobileContainer: React.FC<WeatherMobileLayoutProps> = ({ 
  children, 
  className 
}) => (
  <div className={cn(
    'flex flex-col h-full',
    'safe-top safe-bottom safe-left safe-right',
    className
  )}>
    {children}
  </div>
);

interface WeatherMobileHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const WeatherMobileHeader: React.FC<WeatherMobileHeaderProps> = ({
  title,
  subtitle,
  actions,
  className
}) => (
  <div className={cn(
    'flex-shrink-0 p-4 border-b bg-background/95 backdrop-blur-sm',
    'sticky top-0 z-10',
    className
  )}>
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-semibold leading-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 ml-4">
          {actions}
        </div>
      )}
    </div>
  </div>
);

interface WeatherMobileContentProps {
  children: React.ReactNode;
  className?: string;
}

export const WeatherMobileContent: React.FC<WeatherMobileContentProps> = ({
  children,
  className
}) => (
  <div className={cn(
    'flex-1 overflow-auto scroll-smooth',
    'px-4 py-4',
    className
  )}>
    {children}
  </div>
);

interface WeatherMobileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{
    key: string;
    label: string;
    badge?: string | number;
  }>;
  className?: string;
}

export const WeatherMobileTabs: React.FC<WeatherMobileTabsProps> = ({
  activeTab,
  onTabChange,
  tabs,
  className
}) => (
  <div className={cn(
    'flex-shrink-0 border-t bg-background/95 backdrop-blur-sm',
    'px-2 py-2',
    className
  )}>
    <div className="flex rounded-lg bg-muted p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={cn(
            'flex-1 tap-area flex items-center justify-center gap-1.5',
            'rounded-md px-3 py-2 text-sm font-medium transition-all',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            activeTab === tab.key
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <span className="truncate">{tab.label}</span>
          {tab.badge && (
            <span className={cn(
              'inline-flex h-5 w-5 items-center justify-center rounded-full text-xs',
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted-foreground/20 text-muted-foreground'
            )}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  </div>
);

interface WeatherMobileCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const WeatherMobileCard: React.FC<WeatherMobileCardProps> = ({
  children,
  className,
  padding = 'md'
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  return (
    <div className={cn(
      'bg-card border rounded-lg shadow-sm',
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
};

interface WeatherMobileGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const WeatherMobileGrid: React.FC<WeatherMobileGridProps> = ({
  children,
  columns = 2,
  gap = 'md',
  className
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4'
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4'
  };

  return (
    <div className={cn(
      'grid',
      gridClasses[columns],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
};

interface WeatherMobileMetricProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export const WeatherMobileMetric: React.FC<WeatherMobileMetricProps> = ({
  label,
  value,
  icon,
  trend,
  className
}) => {
  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-muted-foreground'
  };

  return (
    <div className={cn(
      'flex flex-col space-y-1.5 p-3 bg-muted/30 rounded-lg',
      className
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {label}
        </span>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
      <div className={cn(
        'text-xl font-bold leading-none',
        trend && trendColors[trend]
      )}>
        {value}
      </div>
    </div>
  );
};

interface WeatherMobileAlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'warning' | 'error' | 'success';
  className?: string;
}

export const WeatherMobileAlert: React.FC<WeatherMobileAlertProps> = ({
  children,
  variant = 'info',
  className
}) => {
  const variantClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
  };

  return (
    <div className={cn(
      'p-3 border rounded-lg text-sm',
      variantClasses[variant],
      className
    )}>
      {children}
    </div>
  );
};