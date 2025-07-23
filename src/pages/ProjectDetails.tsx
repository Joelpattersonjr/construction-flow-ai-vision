import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, MapPin, FileText, Users, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

import FileManager from '@/components/file-management/FileManager';
import TeamManagementPanel from '@/components/projects/TeamManagementPanel';
import { ContractCountdown } from '@/components/project/ContractCountdown';
import { ContractSetupForm } from '@/components/project/ContractSetupForm';

interface Project {
  id: string;
  name: string;
  project_number: string | null;
  address: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  owner_name: string | null;
  owner_company: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  ntp_date?: string;
  original_completion_date?: string;
  current_completion_date?: string;
  contract_duration_days?: number;
  total_extensions_days?: number;
  extension_history?: any[];
  fileCount?: number;
  memberCount?: number;
  hasWritePermission?: boolean;
}

const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const loadProject = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      
      // Get project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Get file count
      const { count: fileCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      // Get member count
      const { count: memberCount } = await supabase
        .from('project_members_enhanced')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      // Check user permissions
      const { data: memberData } = await supabase
        .from('project_members_enhanced')
        .select('permissions, role')
        .eq('project_id', projectId)
        .eq('user_id', user?.id)
        .single();

      const isOwner = projectData.owner_id === user?.id;
      const isCompanyAdmin = profile?.company_role === 'company_admin';
      const hasPermissions = memberData?.permissions || null;
      
      const hasWritePermission = isOwner || isCompanyAdmin || 
        (hasPermissions && (hasPermissions as any)?.write === true);

      setProject({
        ...projectData,
        fileCount: fileCount || 0,
        memberCount: memberCount || 0,
        hasWritePermission,
        total_extensions_days: projectData.total_extensions_days || 0,
        extension_history: Array.isArray(projectData.extension_history) ? projectData.extension_history : []
      });

    } catch (error) {
      toast({
        title: "Error loading project",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId, user?.id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Project not found</h3>
              <p className="text-gray-500 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
              <Button onClick={() => navigate('/projects')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/projects')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              {project.project_number && (
                <p className="text-gray-600 font-mono text-sm mt-1">{project.project_number}</p>
              )}
            </div>
            {project.status && (
              <Badge className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
            )}
          </div>
        </div>

        {/* Project Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{project.fileCount}</p>
                  <p className="text-sm text-gray-600">Files</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{project.memberCount}</p>
                  <p className="text-sm text-gray-600">Team Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-gray-600">{formatDate(project.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Details Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Contract Countdown Section */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {project.ntp_date && project.current_completion_date ? (
                  <ContractCountdown project={project} onUpdate={loadProject} />
                ) : (
                  <ContractSetupForm project={project} onUpdate={loadProject} />
                )}
              </div>
              
              {/* Project Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.address && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 mt-1 text-gray-400" />
                      <div>
                        <p className="font-medium">Address</p>
                        <p className="text-gray-600">{project.address}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">Start Date</p>
                      <p className="text-gray-600">{formatDate(project.start_date)}</p>
                    </div>
                    <div>
                      <p className="font-medium">End Date</p>
                      <p className="text-gray-600">{formatDate(project.end_date)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {(project.owner_name || project.owner_company || project.owner_email) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Owner Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {project.owner_name && (
                      <div>
                        <p className="font-medium">Name</p>
                        <p className="text-gray-600">{project.owner_name}</p>
                      </div>
                    )}
                    {project.owner_company && (
                      <div>
                        <p className="font-medium">Company</p>
                        <p className="text-gray-600">{project.owner_company}</p>
                      </div>
                    )}
                    {project.owner_email && (
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-gray-600">{project.owner_email}</p>
                      </div>
                    )}
                    {project.owner_phone && (
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-gray-600">{project.owner_phone}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="files">
            <FileManager 
              projectId={project.id} 
              hasWritePermission={project.hasWritePermission || false}
            />
          </TabsContent>

          <TabsContent value="team">
            <TeamManagementPanel 
              projectId={project.id}
              projectName={project.name || 'Untitled Project'}
              hasWritePermission={project.hasWritePermission || false}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProjectDetails;