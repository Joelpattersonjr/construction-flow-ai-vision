import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Settings, Users, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ProjectMembersTable from '@/components/permissions/ProjectMembersTable';
import AddMemberDialog from '@/components/permissions/AddMemberDialog';
import { useAuth } from '@/contexts/AuthContext';

interface Project {
  id: string;
  name: string;
  company_id: number;
  owner_id: string;
}

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

const ProjectPermissions: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Debug log to see what projectId we're getting
  console.log('ProjectPermissions projectId:', projectId);

  const loadProject = async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);

      // Check if user can manage permissions
      const isOwner = data.owner_id === user?.id;
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_role')
        .eq('id', user?.id)
        .single();

      const isCompanyAdmin = profile?.company_role === 'company_admin';
      setCanManage(isOwner || isCompanyAdmin);
    } catch (error) {
      toast({
        title: "Error loading project",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const loadMembers = async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('project_members_enhanced')
        .select(`
          id,
          user_id,
          role,
          permissions,
          profiles:user_id (
            full_name,
            job_title
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      
      // Type-safe permission handling
      const typedMembers = (data || []).map(member => ({
        ...member,
        permissions: member.permissions as { read: boolean; write: boolean; admin: boolean; }
      }));
      
      setMembers(typedMembers);
    } catch (error) {
      toast({
        title: "Error loading members",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadMembers();
    }
  }, [projectId, user?.id]);

  const handleMemberUpdated = () => {
    loadMembers();
  };

  const handleMemberAdded = () => {
    loadMembers();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Project not found</h3>
            <p className="text-gray-500">The project you're looking for doesn't exist or you don't have access to it.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Project Permissions
          </h1>
          <p className="text-gray-600 mt-2">
            Manage access and permissions for "{project.name}"
          </p>
        </div>
        
        {canManage && (
          <AddMemberDialog 
            projectId={projectId!}
            onMemberAdded={handleMemberAdded}
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
                projectId={projectId!}
                members={members}
                canManage={canManage}
                onMemberUpdated={handleMemberUpdated}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectPermissions;