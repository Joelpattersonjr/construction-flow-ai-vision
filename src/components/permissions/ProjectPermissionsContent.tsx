import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users } from 'lucide-react';
import ProjectMembersTable from './ProjectMembersTable';
import AddMemberDialog from './AddMemberDialog';

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
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Project Permissions
          </h1>
          <p className="text-gray-600 mt-2">
            Manage access and permissions for "{projectName}"
          </p>
        </div>
        
        {canManage && (
          <AddMemberDialog 
            projectId={projectId}
            onMemberAdded={onMemberAdded}
          />
        )}
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Members ({members.length})
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
            <CardContent>
              <ProjectMembersTable
                projectId={projectId}
                members={members}
                canManage={canManage}
                onMemberUpdated={onMemberUpdated}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectPermissionsContent;