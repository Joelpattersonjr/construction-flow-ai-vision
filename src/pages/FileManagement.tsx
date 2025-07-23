import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderOpen, Search, ArrowLeft, FileIcon, Users, Shield } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import FileManager from '@/components/file-management/FileManager';


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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-blue-300/20 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-purple-300/20 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      
      

      <main className="container mx-auto py-8 px-4 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12 space-y-6 animate-fade-in relative">
          {/* Back Button */}
          <div className="absolute top-4 left-4 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 bg-white/30 backdrop-blur-sm hover:bg-white/50 transition-all duration-300 border border-white/20 text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>
          
          <div className="relative bg-white/20 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/30">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl backdrop-blur-sm border border-white/20 mb-4 group-hover:scale-110 transition-transform duration-300">
              <FileIcon className="h-10 w-10 text-blue-600 group-hover:rotate-6 transition-transform duration-300" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4">
              File
              <span className="block bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Management
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Upload, organize, and manage all your construction project files with secure access controls and real-time collaboration.
            </p>
          </div>
        </div>

        {!selectedProjectId ? (
          <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-blue-600/5 rounded-t-lg">
              <CardTitle className="flex items-center space-x-3 text-2xl font-bold text-gray-800">
                <div className="p-2 bg-gradient-to-br from-primary/10 to-blue-600/10 rounded-lg">
                  <FolderOpen className="h-6 w-6 text-primary" />
                </div>
                <span>Select a Project</span>
              </CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                Choose a project to view and manage its files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-8">
              {/* Search Projects */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 py-3 bg-white/60 border-white/40 focus:border-primary/50 transition-colors text-lg"
                />
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-4 text-gray-600 text-lg">Loading projects...</p>
                </div>
              ) : (
                <Select value={selectedProjectId || ''} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="py-4 bg-white/60 border-white/40 focus:border-primary/50 transition-colors text-lg">
                    <SelectValue placeholder={projects.length === 0 ? "No accessible projects" : "Select a project..."} />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border-white/40">
                    {filteredProjects.map(project => (
                      <SelectItem key={project.id} value={project.id} className="py-3">
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="font-semibold text-gray-800">{project.name}</div>
                            {project.address && (
                              <div className="text-sm text-gray-500">{project.address}</div>
                            )}
                          </div>
                          {!project.hasWritePermission && (
                            <div className="flex items-center space-x-1 ml-2">
                              <Shield className="h-3 w-3 text-amber-600" />
                              <span className="text-xs text-amber-600 font-medium">Read Only</span>
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100/80 to-gray-200/80 rounded-2xl backdrop-blur-sm mb-6">
                  <FolderOpen className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  {projects.length === 0 ? "No accessible projects" : "No project selected"}
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
                  {projects.length === 0 
                    ? "Contact your administrator to be added to projects with file access."
                    : searchTerm 
                      ? `No projects match "${searchTerm}". Try a different search term.`
                      : "Select a project from the dropdown above to start managing files"
                  }
                </p>
                {projects.length === 0 && (
                  <div className="mt-6 p-4 bg-blue-50/80 rounded-lg border border-blue-200/50">
                    <div className="flex items-center justify-center space-x-2 text-blue-700">
                      <Users className="h-5 w-5" />
                      <span className="font-medium">Need access? Contact your project administrator</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-green-500/5 to-emerald-600/5 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold text-gray-800 flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-lg">
                        <FolderOpen className="h-6 w-6 text-green-600" />
                      </div>
                      <span>{selectedProject?.name}</span>
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-lg flex items-center space-x-2">
                      {selectedProject?.address && (
                        <>
                          <span>{selectedProject.address}</span>
                          <span className="text-gray-400">•</span>
                        </>
                      )}
                      <div className="flex items-center space-x-1">
                        {selectedProject?.hasWritePermission ? (
                          <>
                            <Users className="h-4 w-4 text-green-600" />
                            <span className="text-green-600 font-medium">Full Access</span>
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 text-amber-600" />
                            <span className="text-amber-600 font-medium">Read Only</span>
                          </>
                        )}
                      </div>
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedProjectId(null)}
                    className="bg-white/60 border-white/40 hover:bg-white/80 transition-all duration-300"
                  >
                    Change Project
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-1 shadow-xl border border-white/30">
              <FileManager 
                projectId={selectedProjectId} 
                hasWritePermission={selectedProject?.hasWritePermission || false}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FileManagement;