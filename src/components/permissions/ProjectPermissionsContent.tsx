import React, { useState, useMemo, useEffect } from 'react';
import { auditService, AuditLogEntry } from '@/services/auditService';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import ProjectPermissionsHeader from './ProjectPermissionsHeader';
import ProjectPermissionsTabs from './ProjectPermissionsTabs';
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
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [customRoles, setCustomRoles] = useState<any[]>([]);

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

  // Load templates (placeholder - replace with actual implementation)
  const loadTemplates = async () => {
    try {
      // TODO: Replace with actual template loading logic
      setTemplates([]);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  // Handle custom role operations
  const handleRoleCreated = (role: any) => {
    setCustomRoles(prev => [...prev, role]);
  };

  const handleRoleUpdated = (role: any) => {
    setCustomRoles(prev => prev.map(r => r.id === role.id ? role : r));
  };

  // Handle bulk operations
  const handleBulkOperationComplete = () => {
    onMemberUpdated();
    loadAuditLogs();
    setSelectedMembers([]);
  };

  // Handle import completion
  const handleImportComplete = () => {
    onMemberUpdated();
    loadAuditLogs();
    loadTemplates();
  };

  useEffect(() => {
    loadAuditLogs();
    loadTemplates();
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
      <ProjectPermissionsHeader
        projectName={projectName}
        isConnected={isConnected}
        canManage={canManage}
        projectId={projectId}
        onMemberAdded={handleMemberAddedWithAudit}
      />

      <ProjectPermissionsTabs
        projectId={projectId}
        projectName={projectName}
        filteredMembers={filteredAndSortedMembers}
        totalMembers={members.length}
        canManage={canManage}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        selectedMembers={selectedMembers}
        templates={templates}
        auditLogs={auditLogs}
        auditLoading={auditLoading}
        customRoles={customRoles}
        onMemberUpdated={handleMemberUpdatedWithAudit}
        onImportComplete={handleImportComplete}
        onBulkOperationComplete={handleBulkOperationComplete}
        onRoleCreated={handleRoleCreated}
        onRoleUpdated={handleRoleUpdated}
      />

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