import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, UserPlus, UserMinus, UserCog, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AuditLogEntry } from '@/services/auditService';

interface AuditLogTableProps {
  auditLogs: AuditLogEntry[];
  loading?: boolean;
}

const AuditLogTable: React.FC<AuditLogTableProps> = ({ auditLogs, loading }) => {
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'member_added':
        return <UserPlus className="h-4 w-4" />;
      case 'member_removed':
        return <UserMinus className="h-4 w-4" />;
      case 'role_changed':
        return <UserCog className="h-4 w-4" />;
      case 'permissions_updated':
        return <Settings className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'member_added':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'member_removed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'role_changed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'permissions_updated':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatActionType = (actionType: string) => {
    return actionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatActionDescription = (entry: AuditLogEntry) => {
    const actor = entry.profiles?.full_name || 'Unknown User';
    
    // Handle file-related activities from metadata
    if (entry.metadata && typeof entry.metadata === 'object') {
      const metadata = entry.metadata as any;
      if (metadata.action) {
        switch (metadata.action) {
          case 'file_uploaded':
            return `${actor} uploaded file "${metadata.fileName}" (${metadata.fileType})`;
          case 'file_deleted':
            return `${actor} deleted file "${metadata.fileName}"`;
          case 'file_renamed':
            return `${actor} renamed file from "${metadata.oldFileName}" to "${metadata.newFileName}"`;
          case 'file_accessed':
            return `${actor} accessed file "${metadata.fileName}"`;
          default:
            break;
        }
      }
    }
    const target = entry.target_profiles?.full_name || 'Unknown User';

    switch (entry.action_type) {
      case 'member_added':
        return `${actor} added ${target} to the project`;
      case 'member_removed':
        return `${actor} removed ${target} from the project`;
      case 'role_changed':
        const oldRole = entry.old_value?.role || 'Unknown';
        const newRole = entry.new_value?.role || 'Unknown';
        return `${actor} changed ${target}'s role from ${oldRole} to ${newRole}`;
      case 'permissions_updated':
        return `${actor} updated ${target}'s permissions`;
      default:
        return `${actor} performed an action`;
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Loading audit log...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
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
          Recent Activity
        </CardTitle>
        <CardDescription>
          Track all permission changes and member management activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {auditLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No activity logged yet</p>
            <p className="text-sm">Actions will appear here as team members are added or permissions change</p>
          </div>
        ) : (
          <div className="space-y-4">
            {auditLogs.map((entry) => (
              <div key={entry.id} className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className={`p-2 rounded-full ${getActionColor(entry.action_type)}`}>
                  {getActionIcon(entry.action_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {formatActionDescription(entry)}
                    </p>
                    <Badge variant="outline" className={getActionColor(entry.action_type)}>
                      {formatActionType(entry.action_type)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(entry.profiles?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{entry.profiles?.full_name || 'Unknown User'}</span>
                    </div>
                    
                    <span>•</span>
                    
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {(entry.old_value || entry.new_value) && (
                    <div className="mt-2 text-xs">
                      {entry.action_type === 'role_changed' && (
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Was: {entry.old_value?.role}
                          </Badge>
                          <span>→</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Now: {entry.new_value?.role}
                          </Badge>
                        </div>
                      )}
                      {entry.action_type === 'permissions_updated' && (
                        <div className="space-y-1">
                          <div className="font-medium">Permission Changes:</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="font-medium">Before:</span>
                              <div className="space-x-1">
                                {entry.old_value?.permissions?.read && <Badge variant="outline" className="text-xs">Read</Badge>}
                                {entry.old_value?.permissions?.write && <Badge variant="outline" className="text-xs">Write</Badge>}
                                {entry.old_value?.permissions?.admin && <Badge variant="outline" className="text-xs">Admin</Badge>}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">After:</span>
                              <div className="space-x-1">
                                {entry.new_value?.permissions?.read && <Badge variant="outline" className="text-xs">Read</Badge>}
                                {entry.new_value?.permissions?.write && <Badge variant="outline" className="text-xs">Write</Badge>}
                                {entry.new_value?.permissions?.admin && <Badge variant="outline" className="text-xs">Admin</Badge>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditLogTable;