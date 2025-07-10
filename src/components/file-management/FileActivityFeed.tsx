import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Download, Upload, Eye, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fileAnalyticsService, FileAnalytic } from '@/services/fileAnalyticsService';

interface FileActivityFeedProps {
  projectId: string;
}

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case 'upload': return Upload;
    case 'download': return Download;
    case 'view': return Eye;
    case 'delete': return Trash2;
    default: return Activity;
  }
};

const getActionColor = (actionType: string) => {
  switch (actionType) {
    case 'upload': return 'text-green-600';
    case 'download': return 'text-blue-600';
    case 'view': return 'text-gray-600';
    case 'delete': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

const getActionLabel = (actionType: string) => {
  switch (actionType) {
    case 'upload': return 'Uploaded';
    case 'download': return 'Downloaded';
    case 'view': return 'Viewed';
    case 'delete': return 'Deleted';
    default: return 'Activity';
  }
};

const FileActivityFeed: React.FC<FileActivityFeedProps> = ({ projectId }) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      setLoading(true);
      try {
        const data = await fileAnalyticsService.getRecentFileActivity(projectId, 20);
        setActivities(data);
      } catch (error) {
        console.error('Error loading file activities:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadActivities();
    }
  }, [projectId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent File Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent File Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {activities.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No recent file activity
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => {
                const ActionIcon = getActionIcon(activity.action_type);
                return (
                  <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <ActionIcon className={`h-4 w-4 mt-1 ${getActionColor(activity.action_type)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {getActionLabel(activity.action_type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate">
                        {activity.documents?.file_name || 'Unknown file'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        File activity tracked
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default FileActivityFeed;