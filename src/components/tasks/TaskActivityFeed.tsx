import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Activity, User, Edit, CheckCircle, MessageCircle, Paperclip } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface TaskActivity {
  id: string;
  action_type: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  description: string | null;
  created_at: string;
  user: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

interface TaskActivityFeedProps {
  taskId: number;
}

export const TaskActivityFeed: React.FC<TaskActivityFeedProps> = ({ taskId }) => {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['task-activity', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_activity')
        .select(`
          id,
          action_type,
          field_name,
          old_value,
          new_value,
          description,
          created_at,
          user:profiles!user_id (
            id,
            full_name,
            email
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as TaskActivity[];
    },
  });

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'updated':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'status_changed':
        return <CheckCircle className="h-4 w-4 text-orange-600" />;
      case 'assigned':
        return <User className="h-4 w-4 text-purple-600" />;
      case 'commented':
        return <MessageCircle className="h-4 w-4 text-green-600" />;
      case 'file_attached':
        return <Paperclip className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityDescription = (activity: TaskActivity) => {
    if (activity.description) {
      return activity.description;
    }

    const userName = activity.user.full_name || activity.user.email || 'Unknown user';
    
    switch (activity.action_type) {
      case 'created':
        return `${userName} created this task`;
      case 'updated':
        if (activity.field_name && activity.old_value && activity.new_value) {
          return `${userName} changed ${activity.field_name} from "${activity.old_value}" to "${activity.new_value}"`;
        }
        return `${userName} updated this task`;
      case 'status_changed':
        return `${userName} changed status from "${activity.old_value}" to "${activity.new_value}"`;
      case 'assigned':
        return `${userName} assigned this task to ${activity.new_value}`;
      case 'commented':
        return `${userName} added a comment`;
      case 'file_attached':
        return `${userName} attached a file`;
      default:
        return `${userName} performed an action`;
    }
  };

  const getInitials = (name: string | null): string => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading activity...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Activity ({activities.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No activity yet
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3 p-3 border rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(activity.user.full_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getActivityIcon(activity.action_type)}
                    <span className="text-sm">
                      {getActivityDescription(activity)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {activity.action_type.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(activity.created_at), 'MMM d, yyyy at h:mm a')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};