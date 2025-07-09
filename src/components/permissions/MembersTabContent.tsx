import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, SortAsc } from 'lucide-react';
import ProjectMembersTable from './ProjectMembersTable';
import ExportImportDialog from './ExportImportDialog';
import BulkOperationsDialog from './BulkOperationsDialog';
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

interface MembersTabContentProps {
  projectId: string;
  projectName: string;
  members: ProjectMember[];
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
  onMemberUpdated: () => void;
  onImportComplete: () => void;
  onBulkOperationComplete: () => void;
}

const MembersTabContent: React.FC<MembersTabContentProps> = ({
  projectId,
  projectName,
  members,
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
  onMemberUpdated,
  onImportComplete,
  onBulkOperationComplete,
}) => {
  return (
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

        {/* Action Buttons */}
        {canManage && (
          <div className="flex gap-2 flex-wrap">
            <ExportImportDialog
              projectId={projectId}
              projectName={projectName}
              members={members}
              templates={templates}
              auditLogs={auditLogs}
              onImportComplete={onImportComplete}
            />
            <BulkOperationsDialog
              projectId={projectId}
              members={members}
              templates={templates}
              selectedMembers={selectedMembers}
              onBulkOperationComplete={onBulkOperationComplete}
            />
          </div>
        )}

        <ProjectMembersTable
          projectId={projectId}
          members={members}
          canManage={canManage}
          onMemberUpdated={onMemberUpdated}
        />
      </CardContent>
    </Card>
  );
};

export default MembersTabContent;