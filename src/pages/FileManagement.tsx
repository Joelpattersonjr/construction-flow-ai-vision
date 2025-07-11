import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderOpen, Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import FileManager from '@/components/file-management/FileManager';
import AppHeader from '@/components/navigation/AppHeader';

interface Project {
  id: string;
  name: string;
  address: string | null;
  company_id: number;
  hasWritePermission?: boolean;
}

const FileManagement = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    searchParams.get('project') || null
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.address && project.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Load projects with permission checks
  const loadProjects = async () => {
    if (!profile?.company_id) return;
    
    try {
      setLoading(true);
      
      // First get all company projects
      const { data: companyProjects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, address, company_id')
        .eq('company_id', profile.company_id)
        .order('name');

      if (projectsError) throw projectsError;

      // Then check user's permissions for each project
      const projectsWithPermissions = await Promise.all(
        (companyProjects || []).map(async (project) => {
          // Check if user has any permission for this project
          const { data: memberData } = await supabase
            .from('project_members_enhanced')
            .select('permissions, role')
            .eq('project_id', project.id)
            .eq('user_id', user?.id)
            .single();

          // Check if user is project owner or company admin
          const { data: projectOwnerData } = await supabase
            .from('projects')
            .select('owner_id')
            .eq('id', project.id)
            .single();

          const isOwner = projectOwnerData?.owner_id === user?.id;
          const isCompanyAdmin = profile?.company_role === 'company_admin';
          const hasPermissions = memberData?.permissions || null;
          
          // User can access if they are owner, company admin, or have explicit permissions
          const canAccess = isOwner || isCompanyAdmin || hasPermissions;
          
          if (!canAccess) return null;

          // Determine write permission
          const hasWritePermission = isOwner || isCompanyAdmin || 
            (hasPermissions && (hasPermissions as any)?.write === true);

          return {
            ...project,
            hasWritePermission
          };
        })
      );

      // Filter out projects user can't access
      const accessibleProjects = projectsWithPermissions.filter(Boolean) as Project[];
      setProjects(accessibleProjects);

    } catch (error) {
      toast({
        title: "Failed to load projects",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [profile?.company_id, user?.id]);

  // Update URL when project selection changes
  useEffect(() => {
    if (selectedProjectId) {
      navigate(`/files?project=${selectedProjectId}`, { replace: true });
    } else {
      navigate('/files', { replace: true });
    }
  }, [selectedProjectId, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">File Management</h1>
          <p className="text-muted-foreground">
            Upload, organize, and manage all your construction project files
          </p>
        </div>

        {!selectedProjectId ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FolderOpen className="h-5 w-5" />
                <span>Select a Project</span>
              </CardTitle>
              <CardDescription>
                Choose a project to view and manage its files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Projects */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading projects...</p>
                </div>
              ) : (
                <Select value={selectedProjectId || ''} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder={projects.length === 0 ? "No accessible projects" : "Select a project..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProjects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="font-medium">{project.name}</div>
                            {project.address && (
                              <div className="text-sm text-gray-500">{project.address}</div>
                            )}
                          </div>
                          {!project.hasWritePermission && (
                            <span className="text-xs text-amber-600 ml-2">Read Only</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <div className="text-center py-8">
                <FolderOpen className="mx-auto h-16 w-16 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {projects.length === 0 ? "No accessible projects" : "No project selected"}
                </h3>
                <p className="mt-2 text-gray-500">
                  {projects.length === 0 
                    ? "Contact your administrator to be added to projects with file access."
                    : searchTerm 
                      ? `No projects match "${searchTerm}". Try a different search term.`
                      : "Select a project from the dropdown above to start managing files"
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedProject?.name}</CardTitle>
                    <CardDescription>{selectedProject?.address}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedProjectId(null)}
                  >
                    Change Project
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <FileManager 
              projectId={selectedProjectId} 
              hasWritePermission={selectedProject?.hasWritePermission || false}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default FileManagement;