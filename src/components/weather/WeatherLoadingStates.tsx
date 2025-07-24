import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WeatherSkeletonProps {
  className?: string;
}

export const WeatherCurrentSkeleton: React.FC<WeatherSkeletonProps> = ({ className }) => (
  <Card className={cn('p-6 animate-fade-in', className)}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-muted/50 rounded-lg p-3 space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  </Card>
);

export const WeatherHistorySkeleton: React.FC<WeatherSkeletonProps> = ({ className }) => (
  <div className={cn('space-y-4 animate-fade-in', className)}>
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-9 w-24" />
    </div>
    
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="flex gap-4 text-right">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const WeatherTrendsSkeleton: React.FC<WeatherSkeletonProps> = ({ className }) => (
  <div className={cn('space-y-4 animate-fade-in', className)}>
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
    
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="p-4">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-16" />
        </Card>
      ))}
    </div>
    
    <div className="space-y-4">
      <Skeleton className="h-64 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  </div>
);

interface ProgressiveLoadingProps {
  stage: 'weather' | 'history' | 'trends' | 'complete';
  className?: string;
}

export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({ stage, className }) => {
  const stages = [
    { key: 'weather', label: 'Loading current weather...', completed: ['weather', 'history', 'trends', 'complete'].includes(stage) },
    { key: 'history', label: 'Fetching historical data...', completed: ['history', 'trends', 'complete'].includes(stage) },
    { key: 'trends', label: 'Analyzing trends...', completed: ['trends', 'complete'].includes(stage) },
    { key: 'complete', label: 'Ready!', completed: stage === 'complete' },
  ];

  return (
    <div className={cn('space-y-3 p-4', className)}>
      {stages.map((stageItem) => (
        <div key={stageItem.key} className="flex items-center gap-3">
          <div className={cn(
            'h-2 w-2 rounded-full transition-colors duration-300',
            stageItem.completed ? 'bg-primary' : 'bg-muted'
          )} />
          <span className={cn(
            'text-sm transition-colors duration-300',
            stageItem.completed ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {stageItem.label}
          </span>
          {stageItem.key === stage && stage !== 'complete' && (
            <div className="ml-auto">
              <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};