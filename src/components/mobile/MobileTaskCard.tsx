import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Clock, 
  User, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Circle,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileTaskCardProps {
  task: {
    id: number;
    title: string;
    status: string;
    priority: string;
    assignee_id?: string;
    start_date?: string;
    end_date?: string;
    description?: string;
  };
  assignee?: {
    full_name: string;
    avatar_url?: string;
  };
  onSelect: (taskId: number) => void;
  className?: string;
}

export const MobileTaskCard: React.FC<MobileTaskCardProps> = ({
  task,
  assignee,
  onSelect,
  className
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Circle className="h-4 w-4 text-blue-600" />;
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = task.end_date && new Date(task.end_date) < new Date();

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98]",
        isOverdue && "border-l-4 border-l-red-500",
        !isOverdue && "border-l-4 border-l-primary",
        className
      )}
      onClick={() => onSelect(task.id)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {getStatusIcon(task.status)}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-base text-foreground line-clamp-2">
                {task.title || 'Untitled Task'}
              </h3>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn("text-xs", getPriorityColor(task.priority || ''))}>
            {task.priority || 'Medium'}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {task.status || 'Pending'}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          {assignee && (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={assignee.avatar_url} />
                <AvatarFallback className="text-xs">
                  {assignee.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground truncate">
                {assignee.full_name}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {task.start_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(task.start_date)}</span>
              </div>
            )}
            {task.end_date && (
              <div className={cn(
                "flex items-center gap-1",
                isOverdue && "text-red-600 font-medium"
              )}>
                <Clock className="h-3 w-3" />
                <span>{formatDate(task.end_date)}</span>
                {isOverdue && <span className="text-red-600">• Overdue</span>}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};