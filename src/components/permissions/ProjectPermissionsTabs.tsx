import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Layout, Clock, BarChart3 } from 'lucide-react';
import MembersTabContent from './MembersTabContent';
import TemplatesTabContent from './TemplatesTabContent';
import ActivityTabContent from './ActivityTabContent';
import AnalyticsTabContent from './AnalyticsTabContent';
import { AuditLogEntry } from '@/services/auditService';

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

interface ProjectPermissionsTabsProps {
  projectId: string;
  projectName: string;
  filteredMembers: ProjectMember[];
  totalMembers: number;
  canManage: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  roleFilter: string;
  setRoleFilter: (filter: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  selectedMembers: string[];
  templates: any[];
  auditLogs: AuditLogEntry[];
  auditLoading: boolean;
  customRoles: any[];
  onMemberUpdated: () => void;
  onImportComplete: () => void;
  onBulkOperationComplete: () => void;
  onRoleCreated: (role: any) => void;
  onRoleUpdated: (role: any) => void;
}

const ProjectPermissionsTabs: React.FC<ProjectPermissionsTabsProps> = ({
  projectId,
  projectName,
  filteredMembers,
  totalMembers,
  canManage,
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  sortBy,
  setSortBy,
  selectedMembers,
  templates,
  auditLogs,
  auditLoading,
  customRoles,
  onMemberUpdated,
  onImportComplete,
  onBulkOperationComplete,
  onRoleCreated,
  onRoleUpdated,
}) => {
  return (
    <Tabs defaultValue="members" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="members" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Team Members ({filteredMembers.length} of {totalMembers})
        </TabsTrigger>
        <TabsTrigger value="templates" className="flex items-center gap-2">
          <Layout className="h-4 w-4" />
          Templates
        </TabsTrigger>
        <TabsTrigger value="activity" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Activity
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Analytics
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="members" className="space-y-4">
        <MembersTabContent
          projectId={projectId}
          projectName={projectName}
          members={filteredMembers}
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
          onMemberUpdated={onMemberUpdated}
          onImportComplete={onImportComplete}
          onBulkOperationComplete={onBulkOperationComplete}
        />
      </TabsContent>

      <TabsContent value="templates" className="space-y-4">
        <TemplatesTabContent
          canManage={canManage}
          customRoles={customRoles}
          onRoleCreated={onRoleCreated}
          onRoleUpdated={onRoleUpdated}
        />
      </TabsContent>

      <TabsContent value="activity" className="space-y-4">
        <ActivityTabContent
          auditLogs={auditLogs}
          loading={auditLoading}
        />
      </TabsContent>

      <TabsContent value="analytics" className="space-y-4">
        <AnalyticsTabContent
          members={filteredMembers}
          templates={templates}
          projectId={projectId}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ProjectPermissionsTabs;