import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  UserIcon, 
  EditIcon, 
  TrashIcon,
  ClockIcon,
  FlagIcon,
  MessageSquare,
  Paperclip,
  Eye,
  Tag
} from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TaskWithDetails, TaskPriority, TaskStatus, TaskLabel } from '@/types/tasks';
import { TaskDetailsDialog } from './TaskDetailsDialog';

interface TaskItemProps {
  task: TaskWithDetails;
  onEdit: (task: TaskWithDetails) => void;
  onDelete: (taskId: number) => void;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
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
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [labels, setLabels] = useState<TaskLabel[]>([]);
  const status = (task.status as TaskStatus) || 'todo';
  const priority = (task.priority as TaskPriority) || 'medium';
  
  const statusStyle = statusConfig[status];
  const priorityStyle = priorityConfig[priority];

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Load task labels when component mounts
  React.useEffect(() => {
    const loadLabels = async () => {
      try {
        const { taskService } = await import('@/services/taskService');
        const taskLabels = await taskService.getTaskLabels(task.id);
        setLabels(taskLabels);
      } catch (error) {
        console.error('Failed to load task labels:', error);
      }
    };
    loadLabels();
  }, [task.id]);

  const isOverdue = task.end_date && new Date(task.end_date) < new Date() && status !== 'completed';

  return (
    <Card className={`transition-all hover:shadow-md ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
      <CardHeader className="pb-3">
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
          </div>
          <div className="flex items-center gap-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(true)}
              className="h-8 w-8 p-0"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(task)}
              className="h-8 w-8 p-0"
              title="Edit Task"
            >
              <EditIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task.id)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Delete Task"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
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

        {/* Task Labels */}
        {labels.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {labels.slice(0, 3).map((label) => (
              <Badge 
                key={label.id} 
                variant="outline" 
                className="text-xs gap-1"
                style={{ borderColor: label.label_color, color: label.label_color }}
              >
                <Tag className="h-2 w-2" />
                {label.label_name}
              </Badge>
            ))}
            {labels.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{labels.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {(task.start_date && task.end_date) && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Duration: {format(new Date(task.start_date), 'MMM d')} - {format(new Date(task.end_date), 'MMM d')}</span>
            </div>
          </div>
        )}

        {/* Quick Info Actions */}
        <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={() => setShowDetails(true)}>
            <MessageSquare className="h-3 w-3" />
            <span>Comments</span>
          </div>
          <div className="flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={() => setShowDetails(true)}>
            <Paperclip className="h-3 w-3" />
            <span>Files</span>
          </div>
        </div>
      </CardContent>

      <TaskDetailsDialog
        task={task}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
    </Card>
  );
};