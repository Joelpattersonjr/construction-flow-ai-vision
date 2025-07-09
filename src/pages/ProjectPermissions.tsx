import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Settings, Users, UserPlus, User, ChevronDown, LogOut, UserCheck, Building2 } from 'lucide-react';
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
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">ProjectPulse</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm text-gray-600">
                      {profile?.full_name || user?.email}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="border-b pb-3">
                      <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                        <UserCheck className="h-4 w-4" />
                        <span>Account Information</span>
                      </h3>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start space-x-2">
                        <span className="font-medium text-gray-700 min-w-[60px]">Name:</span>
                        <span className="text-gray-600">{profile?.full_name || 'Not provided'}</span>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <span className="font-medium text-gray-700 min-w-[60px]">Email:</span>
                        <span className="text-gray-600 break-all">{user?.email}</span>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <span className="font-medium text-gray-700 min-w-[60px]">Role:</span>
                        <span className="text-gray-600">{profile?.job_title || 'User'}</span>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <span className="font-medium text-gray-700 min-w-[60px]">Status:</span>
                        <span className="text-gray-600 capitalize">
                          {profile?.company_role === 'company_admin' ? 'Company Admin' : 'Team Member'}
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex items-center space-x-2 mb-3">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <h4 className="font-medium text-gray-900">Company Details</h4>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                      <div className="flex items-start space-x-2">
                        <span className="font-medium text-gray-700 min-w-[70px]">Company:</span>
                        <span className="text-gray-600">{profile?.company?.name || 'Not provided'}</span>
                      </div>
                        
                        {profile?.company_role === 'company_member' && (
                          <div className="bg-blue-50 p-2 rounded-md">
                            <p className="text-xs text-blue-700">
                              <span className="font-medium">Welcome to the team!</span>
                              <br />
                              You were invited to join {profile?.company?.name || 'this company'} by a company administrator.
                            </p>
                          </div>
                        )}
                        
                        {profile?.company_role === 'company_admin' && (
                          <div className="bg-green-50 p-2 rounded-md">
                            <p className="text-xs text-green-700">
                              <span className="font-medium">Administrator Access</span>
                              <br />
                              You have full access to manage company settings and invite team members.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t pt-3 space-y-2">
                      {profile?.company_role === 'company_admin' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate('/admin')}
                          className="w-full flex items-center justify-center space-x-2"
                        >
                          <Settings className="h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={signOut}
                        className="w-full flex items-center justify-center space-x-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
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
      </main>
    </div>
  );
};

export default ProjectPermissions;