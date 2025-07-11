import React from 'react';
import { Link } from 'lucide-react';
import { TaskWithDetails } from '@/types/tasks';

interface TaskItemHeaderProps {
  task: TaskWithDetails;
  dependencyTask?: TaskWithDetails | null;
}

export const TaskItemHeader: React.FC<TaskItemHeaderProps> = ({
  task,
  dependencyTask,
}) => {
  return (
    <div className="flex-1">
      <h3 className="font-medium text-lg leading-tight">
        {task.title || 'Untitled Task'}
      </h3>
      {task.description && (
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {task.description}
        </p>
      )}
      
      {/* Dependency indicator */}
      {dependencyTask && (
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <Link className="h-3 w-3" />
          <span>Depends on: {dependencyTask.title}</span>
        </div>
      )}
    </div>
  );
};