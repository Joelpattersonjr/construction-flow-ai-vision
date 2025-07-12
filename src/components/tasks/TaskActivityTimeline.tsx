import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Clock, 
  User, 
  Edit3, 
  MessageSquare, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Tag,
  Calendar,
  UserPlus,
  FileIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { taskActivityService } from '@/services/taskActivityService';

interface TaskActivityTimelineProps {
  taskId: number;
}

const getActivityIcon = (actionType: string) => {
  switch (actionType) {
    case 'created':
      return <FileText className="h-4 w-4 text-green-600" />;
    case 'updated':
      return <Edit3 className="h-4 w-4 text-blue-600" />;
    case 'status_changed':
      return <CheckCircle className="h-4 w-4 text-purple-600" />;
    case 'assigned':
      return <UserPlus className="h-4 w-4 text-orange-600" />;
    case 'commented':
      return <MessageSquare className="h-4 w-4 text-blue-600" />;
    case 'file_uploaded':
      return <FileIcon className="h-4 w-4 text-gray-600" />;
    case 'label_added':
      return <Tag className="h-4 w-4 text-indigo-600" />;
    case 'date_changed':
      return <Calendar className="h-4 w-4 text-teal-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

const getActivityColor = (actionType: string) => {
  switch (actionType) {
    case 'created':
      return 'border-green-200 bg-green-50';
    case 'updated':
      return 'border-blue-200 bg-blue-50';
    case 'status_changed':
      return 'border-purple-200 bg-purple-50';
    case 'assigned':
      return 'border-orange-200 bg-orange-50';
    case 'commented':
      return 'border-blue-200 bg-blue-50';
    case 'file_uploaded':
      return 'border-gray-200 bg-gray-50';
    case 'label_added':
      return 'border-indigo-200 bg-indigo-50';
    case 'date_changed':
      return 'border-teal-200 bg-teal-50';
    default:
      return 'border-gray-200 bg-gray-50';
  }
};

const formatActivityDescription = (activity: any) => {
  if (activity.field_name && activity.old_value && activity.new_value) {
    return `${activity.description}: ${activity.old_value} → ${activity.new_value}`;
  }
  return activity.description || 'Task activity';
};

const getInitials = (name: string | null | undefined): string => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const TaskActivityTimeline: React.FC<TaskActivityTimelineProps> = ({ taskId }) => {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['task-activity', taskId],
    queryFn: () => taskActivityService.getTaskActivity(taskId),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activity recorded yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="relative">
              {/* Timeline line */}
              {index < activities.length - 1 && (
                <div className="absolute left-4 top-12 w-0.5 h-6 bg-gray-200" />
              )}
              
              <div className="flex items-start gap-3">
                {/* Activity icon */}
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${getActivityColor(activity.action_type)}`}>
                  {getActivityIcon(activity.action_type)}
                </div>
                
                {/* Activity content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {formatActivityDescription(activity)}
                      </p>
                      
                      {/* User info */}
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {getInitials(activity.user?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {activity.user?.full_name || 'Unknown User'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Timestamp */}
                    <div className="text-xs text-muted-foreground ml-2">
                      {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                    </div>
                  </div>
                  
                  {/* Action type badge */}
                  <Badge variant="outline" className="mt-2 text-xs">
                    {activity.action_type.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};