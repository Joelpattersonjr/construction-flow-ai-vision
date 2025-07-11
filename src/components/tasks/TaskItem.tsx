import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  UserIcon, 
  EditIcon, 
  TrashIcon,
  ClockIcon,
  FlagIcon,
  MessageCircle,
  Paperclip,
  Link,
  MoreHorizontal
} from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TaskWithDetails, TaskPriority, TaskStatus } from '@/types/tasks';
// import { TaskLabels } from './TaskLabels';
import { TaskComments } from './TaskComments';
import { TaskActivityFeed } from './TaskActivityFeed';
import { TaskFileAttachments } from './TaskFileAttachments';

interface TaskItemProps {
  task: TaskWithDetails;
  onEdit: (task: TaskWithDetails) => void;
  onDelete: (taskId: number) => void;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onAddLabel?: (taskId: number, name: string, color: string) => void;
  onRemoveLabel?: (labelId: string) => void;
  // Bulk selection
  isSelected?: boolean;
  onSelect?: (taskId: number, selected: boolean) => void;
  // Dependencies
  dependencyTask?: TaskWithDetails | null;
}

const statusConfig = {
  todo: { label: 'To Do', color: 'bg-gray-100 text-gray-800' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  review: { label: 'Review', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  blocked: { label: 'Blocked', color: 'bg-red-100 text-red-800' },
};

const priorityConfig = {
  low: { label: 'Low', color: 'text-green-600', icon: '🟢' },
  medium: { label: 'Medium', color: 'text-yellow-600', icon: '🟡' },
  high: { label: 'High', color: 'text-orange-600', icon: '🟠' },
  critical: { label: 'Critical', color: 'text-red-600', icon: '🔴' },
};

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onAddLabel,
  onRemoveLabel,
  isSelected = false,
  onSelect,
  dependencyTask,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
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
    <Card className={`transition-all hover:shadow-md ${isOverdue ? 'border-red-200 bg-red-50' : ''} ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Bulk selection checkbox */}
          {onSelect && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(task.id, checked as boolean)}
              className="mt-1"
            />
          )}
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
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
              
              <div className="flex items-center gap-1 ml-4">
                {/* Expand/collapse button for additional features */}
                <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(task)}
                  className="h-8 w-8 p-0"
                >
                  <EditIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(task.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
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
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Comments
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setIsExpanded(!isExpanded)}
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

        {/* Task Labels - Temporarily disabled */}
        {/* {task.labels && task.labels.length > 0 && onAddLabel && onRemoveLabel && (
          <TaskLabels
            labels={task.labels}
            onAddLabel={(name, color) => onAddLabel(task.id, name, color)}
            onRemoveLabel={onRemoveLabel}
            className="mt-2"
          />
        )} */}

        {(task.start_date && task.end_date) && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Duration: {format(new Date(task.start_date), 'MMM d')} - {format(new Date(task.end_date), 'MMM d')}</span>
            </div>
          </div>
        )}

        {/* Collapsible sections for detailed features */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent className="space-y-4 mt-4">
            <TaskComments taskId={task.id} />
            <TaskActivityFeed taskId={task.id} />
            <TaskFileAttachments taskId={task.id} />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};