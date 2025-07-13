import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Folder, Calendar, MapPin, FileText, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/navigation/AppHeader';
import { ExportDialog } from '@/components/export/ExportDialog';

interface Project {
  id: string;
  name: string;
  project_number: string;
  address: string;
  status: string;
  start_date: string;
  end_date: string;
  owner_name?: string;
  owner_company?: string;
  owner_email?: string;
  owner_phone?: string;
  created_at: string;
  fileCount?: number;
  recentFileActivity?: string;
}

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [newProject, setNewProject] = useState({
    name: '',
    project_number: '',
    address: '',
    start_date: '',
    end_date: '',
    status: 'planning',
    owner_name: '',
    owner_company: '',
    owner_email: '',
    owner_phone: ''
  });

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Enhance projects with file statistics
      const projectsWithStats = await Promise.all(
        (data || []).map(async (project) => {
          // Get file count for this project
          const { count } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          // Get most recent file activity
          const { data: recentFile } = await supabase
            .from('documents')
            .select('created_at')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...project,
            fileCount: count || 0,
            recentFileActivity: recentFile?.created_at
          };
        })
      );
      
      setProjects(projectsWithStats);
    } catch (error) {
      toast({
        title: "Error loading projects",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast({
        title: "Project name required",
        description: "Please enter a project name",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      console.log('Creating project with data:', {
        name: newProject.name,
        company_id: profile?.company_id,
        owner_id: user?.id
      });

      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: newProject.name,
          project_number: newProject.project_number,
          address: newProject.address,
          start_date: newProject.start_date || null,
          end_date: newProject.end_date || null,
          status: newProject.status,
          company_id: profile?.company_id,
          owner_id: user?.id,
          owner_name: newProject.owner_name,
          owner_company: newProject.owner_company,
          owner_email: newProject.owner_email,
          owner_phone: newProject.owner_phone
        })
        .select()
        .single();

      console.log('Project creation result:', { data, error });

      if (error) throw error;

      // Add the creator as a project member with admin permissions
      await supabase
        .from('project_members_enhanced')
        .insert({
          project_id: data.id,
          user_id: user?.id,
          role: 'admin',
          permissions: { read: true, write: true, admin: true }
        });

      toast({
        title: "Project created",
        description: "Your project has been created successfully",
      });

      setNewProject({
        name: '',
        project_number: '',
        address: '',
        start_date: '',
        end_date: '',
        status: 'planning',
        owner_name: '',
        owner_company: '',
        owner_email: '',
        owner_phone: ''
      });
      setOpen(false);
      loadProjects();
    } catch (error) {
      toast({
        title: "Failed to create project",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <AppHeader />
        <div className="container mx-auto py-8 px-4">
          <div className="animate-pulse space-y-8">
            {/* Hero skeleton */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl mx-auto"></div>
              <div className="h-12 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-64 mx-auto"></div>
              <div className="h-6 bg-slate-200 rounded w-96 mx-auto"></div>
            </div>
            
            {/* Grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-xl p-6 space-y-4">
                  <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-full"></div>
                    <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-8 bg-slate-200 rounded"></div>
                    <div className="h-8 bg-slate-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-40 bg-gradient-to-br from-slate-100/50 to-blue-100/30"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <AppHeader />
      
      <main className="container mx-auto py-8 px-4 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12 space-y-6 animate-fade-in">
          <div className="relative bg-white/20 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/30">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl backdrop-blur-sm border border-white/20 mb-4 group-hover:scale-110 transition-transform duration-300">
              <Folder className="h-10 w-10 text-blue-600 group-hover:rotate-6 transition-transform duration-300" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                Projects
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                {profile?.company_role === 'company_admin' 
                  ? 'Manage your construction projects and track progress with powerful tools'
                  : 'View and access your assigned projects with team collaboration'
                }
              </p>
            </div>
            
            <div className="flex justify-center gap-4 pt-4">
              <ExportDialog 
                projects={projects.map(project => ({
                  id: project.id,
                  name: project.name,
                  project_number: project.project_number,
                  address: project.address,
                  status: project.status,
                  start_date: project.start_date,
                  end_date: project.end_date,
                  owner_name: project.owner_name,
                  owner_company: project.owner_company,
                  created_at: project.created_at,
                }))}
                title="Export Projects"
              />
              
              {profile?.company_role === 'company_admin' && (
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                      Create Project
                    </Button>
                  </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border border-white/20">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Create New Project
                    </DialogTitle>
                    <DialogDescription className="text-slate-600">
                      Add a new construction project to your portfolio.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-6 py-4">
                    {/* Project Information Section */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-800 border-b border-gradient-to-r from-blue-200 to-purple-200 pb-2">
                        Project Information
                      </h4>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="name" className="font-medium text-slate-700">Project Name *</Label>
                        <Input
                          id="name"
                          value={newProject.name}
                          onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter project name"
                          className="border-slate-200 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="project_number" className="font-medium text-slate-700">Project Number</Label>
                        <Input
                          id="project_number"
                          value={newProject.project_number}
                          onChange={(e) => setNewProject(prev => ({ ...prev, project_number: e.target.value }))}
                          placeholder="e.g., PRJ-2024-001"
                          className="border-slate-200 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="address" className="font-medium text-slate-700">Address</Label>
                        <Textarea
                          id="address"
                          value={newProject.address}
                          onChange={(e) => setNewProject(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Project location address"
                          rows={2}
                          className="border-slate-200 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="start_date" className="font-medium text-slate-700">Start Date</Label>
                          <Input
                            id="start_date"
                            type="date"
                            value={newProject.start_date}
                            onChange={(e) => setNewProject(prev => ({ ...prev, start_date: e.target.value }))}
                            className="border-slate-200 focus:border-blue-500 transition-colors"
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="end_date" className="font-medium text-slate-700">End Date</Label>
                          <Input
                            id="end_date"
                            type="date"
                            value={newProject.end_date}
                            onChange={(e) => setNewProject(prev => ({ ...prev, end_date: e.target.value }))}
                            className="border-slate-200 focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Owner Information Section */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-800 border-b border-gradient-to-r from-blue-200 to-purple-200 pb-2">
                        Owner Information
                      </h4>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="owner_name" className="font-medium text-slate-700">Owner Name</Label>
                        <Input
                          id="owner_name"
                          value={newProject.owner_name}
                          onChange={(e) => setNewProject(prev => ({ ...prev, owner_name: e.target.value }))}
                          placeholder="Property/project owner name"
                          className="border-slate-200 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="owner_company" className="font-medium text-slate-700">Owner Company</Label>
                        <Input
                          id="owner_company"
                          value={newProject.owner_company}
                          onChange={(e) => setNewProject(prev => ({ ...prev, owner_company: e.target.value }))}
                          placeholder="Owner company or organization"
                          className="border-slate-200 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="owner_email" className="font-medium text-slate-700">Owner Email</Label>
                          <Input
                            id="owner_email"
                            type="email"
                            value={newProject.owner_email}
                            onChange={(e) => setNewProject(prev => ({ ...prev, owner_email: e.target.value }))}
                            placeholder="owner@example.com"
                            className="border-slate-200 focus:border-blue-500 transition-colors"
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="owner_phone" className="font-medium text-slate-700">Owner Phone</Label>
                          <Input
                            id="owner_phone"
                            type="tel"
                            value={newProject.owner_phone}
                            onChange={(e) => setNewProject(prev => ({ ...prev, owner_phone: e.target.value }))}
                            placeholder="(555) 123-4567"
                            className="border-slate-200 focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={creating}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateProject} 
                      disabled={creating}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {creating ? 'Creating...' : 'Create Project'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="flex justify-center">
            <Card className="max-w-md bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl">
              <CardContent className="p-12 text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl">
                  <Folder className="h-10 w-10 text-slate-400" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-800">
                    {profile?.company_role === 'company_admin' ? 'No projects yet' : 'No projects assigned'}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {profile?.company_role === 'company_admin' 
                      ? 'Create your first project to start managing construction workflows.'
                      : 'Contact your company administrator to be added to projects.'
                    }
                  </p>
                </div>
                {profile?.company_role === 'company_admin' && (
                  <Button 
                    onClick={() => setOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Project
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <Card 
                key={project.id} 
                className="group bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500 overflow-hidden relative animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors duration-300">
                        {project.name}
                      </CardTitle>
                      {project.project_number && (
                        <CardDescription className="font-mono text-sm text-slate-500 bg-slate-100/80 px-2 py-1 rounded-md inline-block">
                          {project.project_number}
                        </CardDescription>
                      )}
                    </div>
                    <span className={`px-3 py-1.5 text-xs font-semibold rounded-full capitalize ${getStatusColor(project.status)} shadow-sm`}>
                      {project.status}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6 relative z-10">
                  {project.address && (
                    <div className="flex items-start space-x-3 text-sm text-slate-600 p-3 bg-slate-50/80 rounded-lg">
                      <MapPin className="h-4 w-4 mt-0.5 text-blue-500" />
                      <span className="leading-relaxed">{project.address}</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 text-sm text-slate-600 p-2 bg-blue-50/50 rounded-lg">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span>Created {formatDate(project.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-slate-600 p-2 bg-purple-50/50 rounded-lg">
                      <FileText className="h-4 w-4 text-purple-500" />
                      <span>{project.fileCount || 0} files</span>
                    </div>
                  </div>

                  {project.recentFileActivity && (
                    <div className="text-xs text-slate-500 bg-slate-50/50 p-2 rounded-lg">
                      Last activity: {formatDate(project.recentFileActivity)}
                    </div>
                  )}
                  
                  <div className="space-y-3 pt-2">
                    <Button 
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="w-full group text-lg px-10 py-4 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold relative overflow-hidden"
                    >
                      <span className="relative z-10">View Details</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/files?project=${project.id}`)}
                        className="flex items-center justify-center space-x-2"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Files</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/projects/${project.id}/permissions`)}
                        className="flex items-center justify-center space-x-2"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Projects;