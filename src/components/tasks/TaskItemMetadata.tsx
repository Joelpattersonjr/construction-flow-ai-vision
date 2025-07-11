import React from 'react';
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  ClockIcon,
  FlagIcon,
  MessageCircle,
  Paperclip
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TaskWithDetails, TaskStatus, TaskPriority } from '@/types/tasks';

interface TaskItemMetadataProps {
  task: TaskWithDetails;
  statusConfig: Record<TaskStatus, { label: string; color: string }>;
  priorityConfig: Record<TaskPriority, { label: string; color: string; icon: string }>;
  onToggleExpanded: () => void;
}

export const TaskItemMetadata: React.FC<TaskItemMetadataProps> = ({
  task,
  statusConfig,
  priorityConfig,
  onToggleExpanded,
}) => {
  // Safely handle status and priority with proper fallbacks
  const statusKey = task.status && typeof task.status === 'string' && task.status in statusConfig 
    ? task.status as TaskStatus 
    : 'todo';
  const priorityKey = task.priority && typeof task.priority === 'string' && task.priority in priorityConfig 
    ? task.priority as TaskPriority 
    : 'medium';
  
  const statusStyle = statusConfig[statusKey];
  const priorityStyle = priorityConfig[priorityKey];

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isOverdue = task.end_date && new Date(task.end_date) < new Date() && statusKey !== 'completed';

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={statusStyle.color}>
            {statusStyle.label}
          </Badge>
          
          <div className={`flex items-center gap-1 text-sm ${priorityStyle.color}`}>
            <FlagIcon className="h-3 w-3" />
            {priorityStyle.label}
          </div>
          
          {task.project?.name && (
            <Badge variant="outline" className="text-xs">
              {task.project.name}
            </Badge>
          )}
          
          {/* Activity indicators */}
          <div className="flex items-center gap-2 ml-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={onToggleExpanded}
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Comments
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={onToggleExpanded}
            >
              <Paperclip className="h-3 w-3 mr-1" />
              Files
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {task.assignee && (
            <div className="flex items-center gap-1">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {getInitials(task.assignee.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">
                {task.assignee.full_name || task.assignee.email}
              </span>
            </div>
          )}
          
          {task.end_date && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
              <CalendarIcon className="h-4 w-4" />
              <span>
                {format(new Date(task.end_date), 'MMM d')}
                {isOverdue && ' (Overdue)'}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-1 text-xs">
            <ClockIcon className="h-3 w-3" />
            {format(new Date(task.created_at), 'MMM d')}
          </div>
        </div>
      </div>

      {(task.start_date && task.end_date) && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Duration: {format(new Date(task.start_date), 'MMM d')} - {format(new Date(task.end_date), 'MMM d')}</span>
          </div>
        </div>
      )}
    </>
  );
};