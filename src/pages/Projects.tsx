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

interface Project {
  id: string;
  name: string;
  project_number: string;
  address: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
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
      setProjects(data || []);
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
      <div className="container mx-auto py-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Folder className="h-8 w-8" />
            Projects
          </h1>
          <p className="text-gray-600 mt-2">
            {profile?.company_role === 'company_admin' 
              ? 'Manage your construction projects and track progress'
              : 'View and access your assigned projects'
            }
          </p>
        </div>
        
        {profile?.company_role === 'company_admin' && (
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a new construction project to your portfolio.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              {/* Project Information Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2">Project Information</h4>
                
                <div className="grid gap-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={newProject.name}
                    onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter project name"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="project_number">Project Number</Label>
                  <Input
                    id="project_number"
                    value={newProject.project_number}
                    onChange={(e) => setNewProject(prev => ({ ...prev, project_number: e.target.value }))}
                    placeholder="e.g., PRJ-2024-001"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={newProject.address}
                    onChange={(e) => setNewProject(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Project location address"
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={newProject.start_date}
                      onChange={(e) => setNewProject(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={newProject.end_date}
                      onChange={(e) => setNewProject(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Owner Information Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2">Owner Information</h4>
                
                <div className="grid gap-2">
                  <Label htmlFor="owner_name">Owner Name</Label>
                  <Input
                    id="owner_name"
                    value={newProject.owner_name}
                    onChange={(e) => setNewProject(prev => ({ ...prev, owner_name: e.target.value }))}
                    placeholder="Property/project owner name"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="owner_company">Owner Company</Label>
                  <Input
                    id="owner_company"
                    value={newProject.owner_company}
                    onChange={(e) => setNewProject(prev => ({ ...prev, owner_company: e.target.value }))}
                    placeholder="Owner company or organization"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="owner_email">Owner Email</Label>
                    <Input
                      id="owner_email"
                      type="email"
                      value={newProject.owner_email}
                      onChange={(e) => setNewProject(prev => ({ ...prev, owner_email: e.target.value }))}
                      placeholder="owner@example.com"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="owner_phone">Owner Phone</Label>
                    <Input
                      id="owner_phone"
                      type="tel"
                      value={newProject.owner_phone}
                      onChange={(e) => setNewProject(prev => ({ ...prev, owner_phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={creating}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject} disabled={creating}>
                {creating ? 'Creating...' : 'Create Project'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Folder className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {profile?.company_role === 'company_admin' ? 'No projects yet' : 'No projects assigned'}
            </h3>
            <p className="text-gray-500 mb-4">
              {profile?.company_role === 'company_admin' 
                ? 'Create your first project to start managing construction workflows.'
                : 'Contact your company administrator to be added to projects.'
              }
            </p>
            {profile?.company_role === 'company_admin' && (
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    {project.project_number && (
                      <CardDescription className="font-mono text-xs">
                        {project.project_number}
                      </CardDescription>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.address && (
                  <div className="flex items-start space-x-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mt-0.5 text-gray-400" />
                    <span>{project.address}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Created {formatDate(project.created_at)}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/files?project=${project.id}`)}
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Files
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/projects/${project.id}/permissions`)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;