import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Folder, Calendar, MapPin, FileText, Settings, ArrowLeft, Search, Filter, Users, Clock, AlertTriangle, CheckCircle, Upload, PlusCircle, Eye, Cloud, Sun, CloudRain, Bolt, Activity, TrendingUp } from 'lucide-react';
import { ProjectWeatherCard } from '@/components/projects/ProjectWeatherCard';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ExportDialog } from '@/components/export/ExportDialog';
import TeamCollaborationPanel from '@/components/projects/TeamCollaborationPanel';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MobileProjectCard } from '@/components/mobile/MobileProjectCard';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { useIsMobile } from '@/hooks/use-mobile';
import { LimitGate } from '@/components/subscription/LimitGate';
import { UsageDashboard } from '@/components/subscription/UsageDashboard';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';

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
  taskCount?: number;
  completedTasks?: number;
  teamMembers?: Array<{
    id: string;
    full_name?: string;
    avatar_url?: string;
  }>;
  recentFiles?: Array<{
    id: number;
    file_name: string;
    created_at: string;
    file_type?: string;
  }>;
  weather?: {
    temperature: number;
    condition: string;
    icon: string;
  };
  phases?: Array<{
    name: string;
    status: 'completed' | 'active' | 'pending';
    start_date: string;
    end_date?: string;
  }>;
}

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [selectedProjectForAction, setSelectedProjectForAction] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isOnline, saveOfflineData, loadOfflineData } = useOfflineStorage();
  const { enforceLimit } = useSubscriptionLimits();

  const [newProject, setNewProject] = useState({
    name: '',
    project_number: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
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
      // Try to load from offline cache first if offline
      if (!isOnline) {
        const cachedData = loadOfflineData();
        if (cachedData?.projects) {
          setProjects(cachedData.projects);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Enhance projects with enhanced statistics
      const projectsWithStats = await Promise.all(
        (data || []).map(async (project) => {
          // Get file count for this project
          const { count: fileCount } = await supabase
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

          // Get task statistics
          const { count: taskCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          const { count: completedTaskCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)
            .eq('status', 'completed');

          // Get team members
          const { data: teamMembers } = await supabase
            .from('project_members_enhanced')
            .select(`
              user_id,
              profiles!inner(
                id,
                full_name,
                avatar_url
              )
            `)
            .eq('project_id', project.id)
            .limit(5);

          // Get recent files
          const { data: recentFiles } = await supabase
            .from('documents')
            .select('id, file_name, created_at, file_type')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false })
            .limit(3);

          // Weather data will be fetched by ProjectWeatherCard component

          // Mock project phases
          const mockPhases = [
            { name: 'Planning', status: 'completed' as const, start_date: project.start_date, end_date: project.start_date },
            { name: 'Foundation', status: project.status === 'completed' ? 'completed' as const : 'active' as const, start_date: project.start_date },
            { name: 'Framing', status: project.status === 'completed' ? 'completed' as const : 'pending' as const, start_date: project.start_date },
            { name: 'Finishing', status: 'pending' as const, start_date: project.start_date }
          ];

          return {
            ...project,
            fileCount: fileCount || 0,
            recentFileActivity: recentFile?.created_at,
            taskCount: taskCount || 0,
            completedTasks: completedTaskCount || 0,
            teamMembers: teamMembers?.map(member => ({
              id: member.profiles.id,
              full_name: member.profiles.full_name,
              avatar_url: member.profiles.avatar_url
            })) || [],
            recentFiles: recentFiles || [],
            phases: mockPhases
          };
        })
      );
      
      setProjects(projectsWithStats);
      
      // Save to offline storage for future offline access
      if (isOnline) {
        saveOfflineData({ projects: projectsWithStats });
      }
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
    // Check project limit before allowing creation
    const canCreate = await enforceLimit('projects');
    if (!canCreate) {
      return;
    }

    if (!newProject.name.trim()) {
      toast({
        title: "Project name required",
        description: "Please enter a project name",
        variant: "destructive",
      });
      return;
    }

    if (!newProject.city.trim() || !newProject.state.trim() || !newProject.zip_code.trim()) {
      toast({
        title: "Location required",
        description: "Please provide city, state, and ZIP code for weather functionality",
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
          city: newProject.city,
          state: newProject.state,
          zip_code: newProject.zip_code,
          country: newProject.country,
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
        city: '',
        state: '',
        zip_code: '',
        country: 'USA',
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
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'planning': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />;
      case 'planning': return <Clock className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'on-hold': return <AlertTriangle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getPriorityLevel = (project: Project) => {
    const now = new Date();
    const endDate = project.end_date ? new Date(project.end_date) : null;
    const daysUntilEnd = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
    
    if (daysUntilEnd !== null && daysUntilEnd < 7) return 'high';
    if (daysUntilEnd !== null && daysUntilEnd < 30) return 'medium';
    return 'low';
  };

  const getProgressPercentage = (project: Project) => {
    if (!project.taskCount || project.taskCount === 0) return 0;
    return Math.round((project.completedTasks || 0) / project.taskCount * 100);
  };

  // Filtered and sorted projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.owner_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'progress':
          return getProgressPercentage(b) - getProgressPercentage(a);
        case 'end_date':
          if (!a.end_date && !b.end_date) return 0;
          if (!a.end_date) return 1;
          if (!b.end_date) return -1;
          return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
        default: // created_at
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [projects, searchTerm, statusFilter, sortBy]);

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'cloudy': return <Cloud className="h-4 w-4 text-gray-500" />;
      case 'rainy': return <CloudRain className="h-4 w-4 text-blue-500" />;
      default: return <Sun className="h-4 w-4 text-yellow-500" />;
    }
  };

  const handleQuickAction = async (action: string, projectId: string) => {
    switch (action) {
      case 'add-task':
        navigate(`/tasks?project=${projectId}&action=create`);
        break;
      case 'upload-file':
        navigate(`/files?project=${projectId}&action=upload`);
        break;
      case 'view-calendar':
        navigate(`/calendar?project=${projectId}`);
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
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
      </AppLayout>
    );
  }

  // Mobile-optimized render
  if (isMobile) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background">
        <MobileHeader 
          title="Projects"
          showBack={true}
          showSearch={true}
          showNotifications={true}
          notificationCount={3}
          onBack={() => {
            console.log('Back button clicked');
            navigate('/dashboard');
          }}
          onSearch={() => {}}
          onNotifications={() => {}}
        />
        
        <main className="px-4 py-6 pb-20 space-y-6">
          {/* Offline indicator */}
          {!isOnline && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800">Viewing cached data (offline)</span>
            </div>
          )}

          {/* Usage Dashboard */}
          <UsageDashboard />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{projects.length}</div>
                <div className="text-sm text-muted-foreground">Total Projects</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {projects.filter(p => p.status === 'active').length}
                </div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Create Project Button */}
          {profile?.company_role === 'company_admin' && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="w-full h-12" size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Project
                </Button>
              </DialogTrigger>
              {/* ... mobile-optimized dialog content ... */}
              <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>Add a new construction project.</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Project Name *</Label>
                    <Input
                      id="name"
                      value={newProject.name}
                      onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter project name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Textarea
                      id="address"
                      value={newProject.address}
                      onChange={(e) => setNewProject(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Street address"
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={newProject.city}
                        onChange={(e) => setNewProject(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="City"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Select 
                        value={newProject.state} 
                        onValueChange={(value) => setNewProject(prev => ({ ...prev, state: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="State" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FL">Florida</SelectItem>
                          <SelectItem value="CA">California</SelectItem>
                          <SelectItem value="TX">Texas</SelectItem>
                          <SelectItem value="NY">New York</SelectItem>
                          <SelectItem value="IL">Illinois</SelectItem>
                          <SelectItem value="PA">Pennsylvania</SelectItem>
                          <SelectItem value="OH">Ohio</SelectItem>
                          <SelectItem value="GA">Georgia</SelectItem>
                          <SelectItem value="NC">North Carolina</SelectItem>
                          <SelectItem value="MI">Michigan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="zip_code">ZIP Code *</Label>
                    <Input
                      id="zip_code"
                      value={newProject.zip_code}
                      onChange={(e) => setNewProject(prev => ({ ...prev, zip_code: e.target.value }))}
                      placeholder="ZIP code"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={newProject.start_date}
                        onChange={(e) => setNewProject(prev => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                    <div>
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

                <DialogFooter className="flex-col space-y-2">
                  <Button 
                    onClick={handleCreateProject} 
                    disabled={creating}
                    className="w-full"
                  >
                    {creating ? 'Creating...' : 'Create Project'}
                  </Button>
                  <Button variant="outline" onClick={() => setOpen(false)} disabled={creating} className="w-full">
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Projects List */}
          {filteredAndSortedProjects.length === 0 ? (
            <Card className="p-8 text-center">
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                {profile?.company_role === 'company_admin' 
                  ? 'Create your first project to get started.'
                  : 'Contact your administrator to be added to projects.'
                }
              </p>
              {profile?.company_role === 'company_admin' && (
                <Button onClick={() => setOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedProjects.map((project) => (
                <MobileProjectCard
                  key={project.id}
                  project={project}
                  taskCount={project.taskCount}
                  teamCount={project.teamMembers?.length}
                  onSelect={(projectId) => navigate(`/projects/${projectId}`)}
                />
              ))}
            </div>
          )}
        </main>
        </div>
      </AppLayout>
    );
  }

  // Desktop render
  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-40 bg-gradient-to-br from-slate-100/50 to-blue-100/30"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <main className="container mx-auto py-8 px-4 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12 space-y-6 animate-fade-in relative">
          {/* Back Button */}
          <div className="absolute top-4 left-4 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log('Desktop back button clicked');
                navigate('/dashboard');
              }}
              className="flex items-center space-x-2 bg-white/30 backdrop-blur-sm hover:bg-white/50 transition-all duration-300 border border-white/20 text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>
          
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
                    <Button className="group text-lg px-10 py-4 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold relative overflow-hidden">
                      <span className="relative z-10 flex items-center">
                        <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                        Create Project
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
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
                      <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-2">
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
                      
                      {/* Location Information Section */}
                      <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                        <h5 className="font-medium text-slate-800">Location Details</h5>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="address" className="font-medium text-slate-700">Street Address</Label>
                          <Textarea
                            id="address"
                            value={newProject.address}
                            onChange={(e) => setNewProject(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Street address (e.g., 123 Main St)"
                            rows={2}
                            className="border-slate-200 focus:border-blue-500 transition-colors"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="city" className="font-medium text-slate-700">City *</Label>
                            <Input
                              id="city"
                              value={newProject.city}
                              onChange={(e) => setNewProject(prev => ({ ...prev, city: e.target.value }))}
                              placeholder="City name"
                              className="border-slate-200 focus:border-blue-500 transition-colors"
                              required
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="state" className="font-medium text-slate-700">State *</Label>
                            <Select 
                              value={newProject.state} 
                              onValueChange={(value) => setNewProject(prev => ({ ...prev, state: value }))}
                            >
                              <SelectTrigger className="border-slate-200 focus:border-blue-500">
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AL">Alabama</SelectItem>
                                <SelectItem value="AK">Alaska</SelectItem>
                                <SelectItem value="AZ">Arizona</SelectItem>
                                <SelectItem value="AR">Arkansas</SelectItem>
                                <SelectItem value="CA">California</SelectItem>
                                <SelectItem value="CO">Colorado</SelectItem>
                                <SelectItem value="CT">Connecticut</SelectItem>
                                <SelectItem value="DE">Delaware</SelectItem>
                                <SelectItem value="FL">Florida</SelectItem>
                                <SelectItem value="GA">Georgia</SelectItem>
                                <SelectItem value="HI">Hawaii</SelectItem>
                                <SelectItem value="ID">Idaho</SelectItem>
                                <SelectItem value="IL">Illinois</SelectItem>
                                <SelectItem value="IN">Indiana</SelectItem>
                                <SelectItem value="IA">Iowa</SelectItem>
                                <SelectItem value="KS">Kansas</SelectItem>
                                <SelectItem value="KY">Kentucky</SelectItem>
                                <SelectItem value="LA">Louisiana</SelectItem>
                                <SelectItem value="ME">Maine</SelectItem>
                                <SelectItem value="MD">Maryland</SelectItem>
                                <SelectItem value="MA">Massachusetts</SelectItem>
                                <SelectItem value="MI">Michigan</SelectItem>
                                <SelectItem value="MN">Minnesota</SelectItem>
                                <SelectItem value="MS">Mississippi</SelectItem>
                                <SelectItem value="MO">Missouri</SelectItem>
                                <SelectItem value="MT">Montana</SelectItem>
                                <SelectItem value="NE">Nebraska</SelectItem>
                                <SelectItem value="NV">Nevada</SelectItem>
                                <SelectItem value="NH">New Hampshire</SelectItem>
                                <SelectItem value="NJ">New Jersey</SelectItem>
                                <SelectItem value="NM">New Mexico</SelectItem>
                                <SelectItem value="NY">New York</SelectItem>
                                <SelectItem value="NC">North Carolina</SelectItem>
                                <SelectItem value="ND">North Dakota</SelectItem>
                                <SelectItem value="OH">Ohio</SelectItem>
                                <SelectItem value="OK">Oklahoma</SelectItem>
                                <SelectItem value="OR">Oregon</SelectItem>
                                <SelectItem value="PA">Pennsylvania</SelectItem>
                                <SelectItem value="RI">Rhode Island</SelectItem>
                                <SelectItem value="SC">South Carolina</SelectItem>
                                <SelectItem value="SD">South Dakota</SelectItem>
                                <SelectItem value="TN">Tennessee</SelectItem>
                                <SelectItem value="TX">Texas</SelectItem>
                                <SelectItem value="UT">Utah</SelectItem>
                                <SelectItem value="VT">Vermont</SelectItem>
                                <SelectItem value="VA">Virginia</SelectItem>
                                <SelectItem value="WA">Washington</SelectItem>
                                <SelectItem value="WV">West Virginia</SelectItem>
                                <SelectItem value="WI">Wisconsin</SelectItem>
                                <SelectItem value="WY">Wyoming</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="zip_code" className="font-medium text-slate-700">ZIP Code *</Label>
                            <Input
                              id="zip_code"
                              value={newProject.zip_code}
                              onChange={(e) => setNewProject(prev => ({ ...prev, zip_code: e.target.value }))}
                              placeholder="ZIP/Postal code"
                              className="border-slate-200 focus:border-blue-500 transition-colors"
                              required
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="country" className="font-medium text-slate-700">Country</Label>
                            <Select 
                              value={newProject.country} 
                              onValueChange={(value) => setNewProject(prev => ({ ...prev, country: value }))}
                            >
                              <SelectTrigger className="border-slate-200 focus:border-blue-500">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USA">United States</SelectItem>
                                <SelectItem value="CAN">Canada</SelectItem>
                                <SelectItem value="MEX">Mexico</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
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
                      <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-2">
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
                      className="group text-lg px-10 py-4 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold relative overflow-hidden"
                    >
                      <span className="relative z-10">
                        {creating ? 'Creating...' : 'Create Project'}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                    </Button>
                  </DialogFooter>
                </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        {showQuickActions && (
          <div className="bg-white/30 backdrop-blur-sm rounded-xl border border-white/20 p-6 shadow-xl mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Quick Actions</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQuickActions(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-white/50 border-white/20 hover:bg-white/70 transition-colors cursor-pointer group"
                    onClick={() => navigate('/tasks?action=create')}>
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <PlusCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-1">Add Task</h4>
                  <p className="text-sm text-slate-600">Create new project tasks</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/50 border-white/20 hover:bg-white/70 transition-colors cursor-pointer group"
                    onClick={() => navigate('/files?action=upload')}>
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-1">Upload File</h4>
                  <p className="text-sm text-slate-600">Add project documents</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/50 border-white/20 hover:bg-white/70 transition-colors cursor-pointer group"
                    onClick={() => navigate('/calendar')}>
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-1">View Calendar</h4>
                  <p className="text-sm text-slate-600">Check project timeline</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Enhanced Filters and Search */}
        <div className="bg-white/30 backdrop-blur-sm rounded-xl border border-white/20 p-6 shadow-xl mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search projects by name, location, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/70 border-white/20 focus:border-blue-300 transition-colors"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48 bg-white/70 border-white/20">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-48 bg-white/70 border-white/20">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Recent</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="end_date">Due Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{projects.length}</div>
              <div className="text-sm text-slate-600">Total Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {projects.filter(p => p.status === 'active').length}
              </div>
              <div className="text-sm text-slate-600">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {projects.filter(p => p.status === 'planning').length}
              </div>
              <div className="text-sm text-slate-600">Planning</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {projects.filter(p => p.status === 'completed').length}
              </div>
              <div className="text-sm text-slate-600">Completed</div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredAndSortedProjects.length === 0 ? (
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
            {filteredAndSortedProjects.map((project, index) => (
              <Card key={project.id} className="group bg-white/70 backdrop-blur-xl border border-white/20 hover:border-white/40 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl shadow-xl rounded-xl overflow-hidden animate-fade-in relative"
                    style={{ animationDelay: `${index * 100}ms` }}>
                {/* Priority indicator */}
                <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
                  getPriorityLevel(project) === 'high' ? 'bg-red-500' :
                  getPriorityLevel(project) === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-700 transition-colors line-clamp-2">
                        {project.name}
                      </CardTitle>
                      {project.project_number && (
                        <p className="text-sm text-slate-500 font-medium mb-2">
                          #{project.project_number}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={`px-3 py-1 text-xs font-medium border ${getStatusColor(project.status)} flex items-center gap-1`}>
                      {getStatusIcon(project.status)}
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  {project.taskCount && project.taskCount > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Progress</span>
                        <span className="font-medium text-slate-800">{getProgressPercentage(project)}%</span>
                      </div>
                      <Progress value={getProgressPercentage(project)} className="h-2" />
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Project details */}
                  {project.address && (
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{project.address}</span>
                    </div>
                  )}

                  {(project.start_date || project.end_date) && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {project.start_date && formatDate(project.start_date)}
                        {project.start_date && project.end_date && ' - '}
                        {project.end_date && formatDate(project.end_date)}
                      </span>
                    </div>
                  )}

                  {/* Team members */}
                  {project.teamMembers && project.teamMembers.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-600" />
                      <div className="flex -space-x-2">
                        {project.teamMembers.slice(0, 4).map((member, idx) => (
                          <Avatar key={member.id} className="w-6 h-6 border-2 border-white">
                            <AvatarImage src={member.avatar_url || ''} />
                            <AvatarFallback className="text-xs">
                              {member.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {project.teamMembers.length > 4 && (
                          <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs text-slate-600">
                            +{project.teamMembers.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                   {/* Weather Info */}
                   {project.address && (
                     <div className="p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                       <ProjectWeatherCard 
                         projectId={project.id} 
                         address={project.address}
                         className="justify-between"
                       />
                     </div>
                   )}

                   {/* Recent Files Preview */}
                   {project.recentFiles && project.recentFiles.length > 0 && (
                     <div className="space-y-2">
                       <h5 className="text-sm font-medium text-slate-700 flex items-center gap-1">
                         <FileText className="h-3 w-3" />
                         Recent Files
                       </h5>
                       <div className="space-y-1">
                         {project.recentFiles.slice(0, 2).map((file) => (
                           <div key={file.id} className="flex items-center justify-between text-xs p-2 bg-slate-50/50 rounded">
                             <span className="text-slate-600 truncate flex-1">{file.file_name}</span>
                             <span className="text-slate-400 ml-2">
                               {new Date(file.created_at).toLocaleDateString()}
                             </span>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Project Timeline/Phases */}
                   {project.phases && project.phases.length > 0 && (
                     <div className="space-y-2">
                       <h5 className="text-sm font-medium text-slate-700 flex items-center gap-1">
                         <Activity className="h-3 w-3" />
                         Project Phases
                       </h5>
                       <div className="grid grid-cols-2 gap-1">
                         {project.phases.slice(0, 4).map((phase, idx) => (
                           <div key={idx} className={`text-xs p-2 rounded text-center ${
                             phase.status === 'completed' ? 'bg-green-100 text-green-700' :
                             phase.status === 'active' ? 'bg-blue-100 text-blue-700' :
                             'bg-slate-100 text-slate-500'
                           }`}>
                             {phase.name}
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Statistics */}
                   <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                     <div className="text-center">
                       <div className="text-lg font-bold text-slate-800">{project.fileCount || 0}</div>
                       <div className="text-xs text-slate-500">Files</div>
                     </div>
                     <div className="text-center">
                       <div className="text-lg font-bold text-slate-800">{project.taskCount || 0}</div>
                       <div className="text-xs text-slate-500">Tasks</div>
                     </div>
                   </div>

                   {/* Action buttons */}
                   <div className="space-y-2 pt-4">
                     <div className="grid grid-cols-2 gap-2">
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => navigate(`/projects/${project.id}`)}
                         className="group/btn bg-white/50 border-white/20 hover:bg-white/70 transition-all duration-200"
                       >
                         <FileText className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                         Details
                       </Button>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => navigate(`/files?project=${project.id}`)}
                         className="group/btn bg-white/50 border-white/20 hover:bg-white/70 transition-all duration-200"
                       >
                         <Folder className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                         Files
                       </Button>
                     </div>
                     
                     {/* Quick Action Buttons */}
                     <div className="grid grid-cols-3 gap-1">
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => handleQuickAction('add-task', project.id)}
                         className="text-xs bg-blue-50/50 hover:bg-blue-100/50 text-blue-700 border-0"
                       >
                         <PlusCircle className="h-3 w-3 mr-1" />
                         Task
                       </Button>
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => handleQuickAction('upload-file', project.id)}
                         className="text-xs bg-green-50/50 hover:bg-green-100/50 text-green-700 border-0"
                       >
                         <Upload className="h-3 w-3 mr-1" />
                         Upload
                       </Button>
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => handleQuickAction('view-calendar', project.id)}
                         className="text-xs bg-purple-50/50 hover:bg-purple-100/50 text-purple-700 border-0"
                       >
                         <Calendar className="h-3 w-3 mr-1" />
                         Plan
                       </Button>
                     </div>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Team Collaboration Section */}
        <div className="mt-12">
          <TeamCollaborationPanel selectedProjectId={selectedProjectForAction} />
        </div>
      </main>
      </div>
    </AppLayout>
  );
};

export default Projects;