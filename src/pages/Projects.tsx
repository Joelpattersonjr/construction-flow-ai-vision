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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="container mx-auto py-8 px-4">
          <div className="animate-pulse space-y-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl mx-auto"></div>
              <div className="h-12 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-64 mx-auto"></div>
              <div className="h-6 bg-slate-200 rounded w-96 mx-auto"></div>
            </div>
            
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

  // Mobile-optimized render
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader 
          title="Projects"
          showBack={true}
          onBack={() => navigate(-1)}
        />
        
        <main className="px-4 py-6 pb-20 space-y-6">
          {/* Offline indicator */}
          {!isOnline && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800">Viewing cached data (offline)</span>
            </div>
          )}

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

          {/* Usage Dashboard */}
          <UsageDashboard />

          {/* Projects List */}
          {filteredAndSortedProjects.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-6">Get started by creating your first project</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedProjects.map((project) => (
                <MobileProjectCard
                  key={project.id}
                  project={project}
                  onSelect={() => navigate(`/projects/${project.id}`)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // Desktop render
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 relative overflow-hidden">
      
      <main className="container mx-auto py-8 px-4 relative z-10">
        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
            <Folder className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
            Project Management
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Organize, track, and collaborate on your construction projects with powerful tools and insights.
          </p>
        </div>

          {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
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

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date Created</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
              <SelectItem value="end_date">Due Date</SelectItem>
            </SelectContent>
          </Select>

          {profile?.company_role === 'company_admin' && (
            <LimitGate limitType="projects">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="whitespace-nowrap">
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                      Add a new construction project to your portfolio.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Project Name *</Label>
                      <Input
                        id="name"
                        value={newProject.name}
                        onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter project name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="project_number">Project Number</Label>
                      <Input
                        id="project_number"
                        value={newProject.project_number}
                        onChange={(e) => setNewProject(prev => ({ ...prev, project_number: e.target.value }))}
                        placeholder="e.g., P-2024-001"
                      />
                    </div>
                    
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={newProject.address}
                        onChange={(e) => setNewProject(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Street address"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={newProject.city}
                        onChange={(e) => setNewProject(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="City"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={newProject.state}
                        onChange={(e) => setNewProject(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="State"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="zip_code">ZIP Code *</Label>
                      <Input
                        id="zip_code"
                        value={newProject.zip_code}
                        onChange={(e) => setNewProject(prev => ({ ...prev, zip_code: e.target.value }))}
                        placeholder="ZIP code"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={newProject.status} onValueChange={(value) => setNewProject(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="on-hold">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={newProject.start_date}
                        onChange={(e) => setNewProject(prev => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={newProject.end_date}
                        onChange={(e) => setNewProject(prev => ({ ...prev, end_date: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateProject} disabled={creating}>
                      {creating ? "Creating..." : "Create Project"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </LimitGate>
          )}

          <ExportDialog />
        </div>

        {/* Usage Dashboard */}
        <div className="mb-8">
          <UsageDashboard />
        </div>

        {/* Projects Grid */}
        {filteredAndSortedProjects.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-200 to-slate-300 rounded-3xl mx-auto mb-8 flex items-center justify-center">
              <Folder className="h-12 w-12 text-slate-500" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">No projects found</h3>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all' 
                ? "No projects match your current filters. Try adjusting your search criteria."
                : "Get started by creating your first construction project."
              }
            </p>
            {profile?.company_role === 'company_admin' && (
              <LimitGate limitType="projects">
                <Button onClick={() => setOpen(true)} size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Project
                </Button>
              </LimitGate>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAndSortedProjects.map((project) => (
              <Card key={project.id} className="group hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-sm border-white/40 hover:border-blue-200/60 hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {project.name}
                    </CardTitle>
                    {project.project_number && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {project.project_number}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={`${getStatusColor(project.status)} border px-2 py-1 text-xs font-medium flex items-center gap-1`}>
                      {getStatusIcon(project.status)}
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {project.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{project.address}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Cloud className="h-4 w-4" />
                      <ProjectWeatherCard
                        projectId={project.id}
                        projectName={project.name}
                        address={project.address}
                        className=""
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-600">{getProgressPercentage(project)}%</span>
                    </div>
                    <Progress value={getProgressPercentage(project)} className="h-2" />
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{project.taskCount || 0}</div>
                      <div className="text-xs text-blue-600">Tasks</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{project.fileCount || 0}</div>
                      <div className="text-xs text-green-600">Files</div>
                    </div>
                  </div>

                  {/* Team Members */}
                  {project.teamMembers && project.teamMembers.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Team</span>
                      </div>
                      <div className="flex -space-x-2">
                        {project.teamMembers.slice(0, 4).map((member) => (
                          <Avatar key={member.id} className="h-8 w-8 border-2 border-white">
                            <AvatarImage src={member.avatar_url || ''} />
                            <AvatarFallback className="text-xs">
                              {member.full_name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {(project.teamMembers.length > 4) && (
                          <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                            <span className="text-xs text-gray-600">+{project.teamMembers.length - 4}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleQuickAction('add-task', project.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleQuickAction('upload-file', project.id)}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Team Collaboration Panel */}
        <div className="mt-12">
          <TeamCollaborationPanel selectedProjectId={selectedProjectForAction} />
        </div>
      </main>
    </div>
  );
};

export default Projects;