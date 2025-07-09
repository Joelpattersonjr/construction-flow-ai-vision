import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Settings, Users, Search, Filter, SortAsc, Clock, Wifi, WifiOff, Layout } from 'lucide-react';
import ProjectMembersTable from './ProjectMembersTable';
import AddMemberDialog from './AddMemberDialog';
import AuditLogTable from './AuditLogTable';
import PermissionTemplatesTable from './PermissionTemplatesTable';
import { auditService, AuditLogEntry } from '@/services/auditService';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { Badge } from '@/components/ui/badge';
import LiveUpdateNotification from './LiveUpdateNotification';

interface ProjectMember {
  id: string;
  user_id: string;
  role: string;
  permissions: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
  profiles: {
    full_name: string;
    job_title: string;
  };
  created_at?: string;
}

interface ProjectPermissionsContentProps {
  projectId: string;
  projectName: string;
  members: ProjectMember[];
  canManage: boolean;
  onMemberUpdated: () => void;
  onMemberAdded: () => void;
}

const ProjectPermissionsContent: React.FC<ProjectPermissionsContentProps> = ({
  projectId,
  projectName,
  members,
  canManage,
  onMemberUpdated,
  onMemberAdded,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | undefined>();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'member' | 'audit'>('audit');

  // Load audit logs
  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const logs = await auditService.getProjectAuditLog(projectId);
      setAuditLogs(logs);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [projectId]);

  // Set up real-time updates for audit logs
  const { isConnected } = useRealtimeUpdates({
    projectId,
    onMembersChange: () => {
      // This will be handled by the parent component (ProjectPermissions)
    },
    onAuditLogChange: () => {
      loadAuditLogs();
      setLastUpdate(new Date());
      setNotificationType('audit');
      setShowNotification(true);
    }
  });

  // Refresh audit logs when members are updated
  const handleMemberUpdatedWithAudit = () => {
    onMemberUpdated();
    loadAuditLogs();
  };

  const handleMemberAddedWithAudit = () => {
    onMemberAdded();
    loadAuditLogs();
  };

  // Filter and sort members based on search, filter, and sort criteria
  const filteredAndSortedMembers = useMemo(() => {
    let filtered = members.filter(member => {
      const matchesSearch = member.profiles?.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
        member.profiles?.job_title
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });

    // Sort members
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.profiles?.full_name || '').localeCompare(b.profiles?.full_name || '');
        case 'role':
          const roleOrder = { owner: 0, manager: 1, member: 2, viewer: 3 };
          return (roleOrder[a.role] || 4) - (roleOrder[b.role] || 4);
        case 'recent':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [members, searchTerm, roleFilter, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Project Permissions
            </h1>
            <Badge 
              variant={isConnected ? "default" : "secondary"}
              className={`flex items-center gap-1 ${
                isConnected 
                  ? "bg-green-100 text-green-800 border-green-200" 
                  : "bg-yellow-100 text-yellow-800 border-yellow-200"
              }`}
            >
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isConnected ? "Live" : "Offline"}
            </Badge>
          </div>
          <p className="text-gray-600 mt-2">
            Manage access and permissions for "{projectName}"
            {isConnected && (
              <span className="text-green-600 text-sm ml-2">
                • Updates will appear in real-time
              </span>
            )}
          </p>
        </div>
        
        {canManage && (
          <AddMemberDialog 
            projectId={projectId}
            onMemberAdded={handleMemberAddedWithAudit}
          />
        )}
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Members ({filteredAndSortedMembers.length} of {members.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Team Members</CardTitle>
              <CardDescription>
                Manage who has access to this project and their permission levels.
                {!canManage && " You need to be a project owner or company admin to manage permissions."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search team members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[140px]">
                      <SortAsc className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="role">Role</SelectItem>
                      <SelectItem value="recent">Recently Added</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ProjectMembersTable
                projectId={projectId}
                members={filteredAndSortedMembers}
                canManage={canManage}
                onMemberUpdated={handleMemberUpdatedWithAudit}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <PermissionTemplatesTable 
            canManage={canManage}
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <AuditLogTable 
            auditLogs={auditLogs}
            loading={auditLoading}
          />
        </TabsContent>
      </Tabs>

      <LiveUpdateNotification
        show={showNotification}
        updateType={notificationType}
        lastUpdate={lastUpdate}
        onDismiss={() => setShowNotification(false)}
      />
    </div>
  );
};

export default ProjectPermissionsContent;