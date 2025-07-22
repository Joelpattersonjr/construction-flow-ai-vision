import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, ListIcon, Grid3X3Icon, EditIcon, X, Tag, Clock, BarChart3, ArrowLeft } from 'lucide-react';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MobileTaskCard } from '@/components/mobile/MobileTaskCard';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverEvent,
  DragStartEvent,
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  closestCorners
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskItem } from '@/components/tasks/TaskItem';
import { TaskTemplateManager } from '@/components/tasks/TaskTemplateManager';
import { TaskDetailsDialog } from '@/components/tasks/TaskDetailsDialog';
import { TimeReportingDashboard } from '@/components/tasks/TimeReportingDashboard';
import { AdvancedSearchFilters, AdvancedSearchFilters as AdvancedSearchFiltersType } from '@/components/tasks/AdvancedSearchFilters';
import { taskService } from '@/services/taskService';
import { TaskWithDetails, TaskStatus, TaskPriority } from '@/types/tasks';
import { supabase } from '@/integrations/supabase/client';
import { KanbanColumn } from '@/components/tasks/KanbanColumn';
import { KanbanTaskCard } from '@/components/tasks/KanbanTaskCard';
import { ExportDialog } from '@/components/export/ExportDialog';

const Tasks = () => {
  const isMobile = useIsMobile();
  const { isOnline, saveOfflineData, loadOfflineData } = useOfflineStorage();
  
  // Advanced search filters state
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedSearchFiltersType>({
    searchTerm: '',
    searchFields: ['title', 'description'],
    selectedProject: 'all',
    selectedStatus: [],
    selectedPriority: [],
    selectedLabels: [],
    selectedAssignee: 'all',
    dueDateFrom: undefined,
    dueDateTo: undefined,
    createdDateFrom: undefined,
    createdDateTo: undefined,
    hasTimeLogged: null,
    isOverdue: null,
    quickFilters: [],
  });
  
  // Legacy filter states for backward compatibility
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);
  const [savedSearches, setSavedSearches] = useState<Array<{ id: string; name: string; filters: AdvancedSearchFiltersType }>>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for edit dialog
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  
  // State for task details dialog
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false);
  
  // Drag and drop state
  const [activeTask, setActiveTask] = useState<TaskWithDetails | null>(null);
  const [localTasksByStatus, setLocalTasksByStatus] = useState<Record<string, TaskWithDetails[]>>({});
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  // Open edit dialog when editingTask is set
  React.useEffect(() => {
    if (editingTask) {
      setEditDialogOpen(true);
    }
  }, [editingTask]);

  // Fetch tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskService.getCompanyTasks(),
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all unique labels
  const { data: allLabels = [] } = useQuery({
    queryKey: ['task-labels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_labels')
        .select('label_name, label_color')
        .order('label_name');
      if (error) throw error;
      
      // Get unique labels
      const uniqueLabels = data?.reduce((acc: any[], label) => {
        const existing = acc.find(l => l.label_name === label.label_name);
        if (!existing) {
          acc.push(label);
        }
        return acc;
      }, []) || [];
      
      return uniqueLabels;
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (taskData: any) => taskService.createTask({
      ...taskData,
      start_date: taskData.start_date?.toISOString().split('T')[0],
      end_date: taskData.end_date?.toISOString().split('T')[0],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Task created successfully!' });
    },
    onError: (error) => {
      toast({
        title: 'Error creating task',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) => 
      taskService.updateTask(id, {
        ...updates,
        start_date: updates.start_date?.toISOString().split('T')[0],
        end_date: updates.end_date?.toISOString().split('T')[0],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Task updated successfully!' });
      setEditingTask(null);
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error updating task',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Task deleted successfully!' });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting task',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Advanced filtering logic
  const filteredTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      // Text search across selected fields
      const searchTermLower = advancedFilters.searchTerm.toLowerCase();
      const matchesSearch = !advancedFilters.searchTerm || 
        (advancedFilters.searchFields.includes('title') && task.title?.toLowerCase().includes(searchTermLower)) ||
        (advancedFilters.searchFields.includes('description') && task.description?.toLowerCase().includes(searchTermLower));
      
      // Project filtering
      const matchesProject = advancedFilters.selectedProject === 'all' || task.project_id === advancedFilters.selectedProject;
      
      // Status filtering (multi-select)
      const matchesStatus = advancedFilters.selectedStatus.length === 0 || 
        advancedFilters.selectedStatus.includes(task.status || '');
      
      // Priority filtering (multi-select)
      const matchesPriority = advancedFilters.selectedPriority.length === 0 || 
        advancedFilters.selectedPriority.includes(task.priority || '');
      
      // Label filtering
      const matchesLabels = advancedFilters.selectedLabels.length === 0 || 
        (task.labels && task.labels.some(label => advancedFilters.selectedLabels.includes(label.label_name)));

      // Assignee filtering
      const matchesAssignee = advancedFilters.selectedAssignee === 'all' || 
        (advancedFilters.selectedAssignee === 'unassigned' && !task.assignee_id) ||
        task.assignee_id === advancedFilters.selectedAssignee;

      // Date range filtering
      const taskDueDate = task.end_date ? new Date(task.end_date) : null;
      const taskCreateDate = new Date(task.created_at);
      
      const matchesDueDateRange = (!advancedFilters.dueDateFrom || !taskDueDate || taskDueDate >= advancedFilters.dueDateFrom) &&
        (!advancedFilters.dueDateTo || !taskDueDate || taskDueDate <= advancedFilters.dueDateTo);
      
      const matchesCreateDateRange = (!advancedFilters.createdDateFrom || taskCreateDate >= advancedFilters.createdDateFrom) &&
        (!advancedFilters.createdDateTo || taskCreateDate <= advancedFilters.createdDateTo);

      // Quick filters
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const quickFilterMatches = advancedFilters.quickFilters.length === 0 || advancedFilters.quickFilters.every(filter => {
        switch (filter) {
          case 'my_tasks':
            // This would need current user ID - implement based on your auth system
            return true; // Placeholder
          case 'overdue':
            return taskDueDate && taskDueDate < today && task.status !== 'completed';
          case 'due_today':
            return taskDueDate && taskDueDate.toDateString() === today.toDateString();
          case 'due_this_week':
            return taskDueDate && taskDueDate >= today && taskDueDate <= oneWeekFromNow;
          case 'no_assignee':
            return !task.assignee_id;
          case 'has_time_logged':
            return task.time_entries && task.time_entries.length > 0;
          default:
            return true;
        }
      });

      return matchesSearch && matchesProject && matchesStatus && matchesPriority && 
             matchesLabels && matchesAssignee && matchesDueDateRange && 
             matchesCreateDateRange && quickFilterMatches;
    });
  }, [tasks, advancedFilters]);

  // Group tasks by status for kanban view - use local state if available
  const tasksByStatus = {
    todo: filteredTasks.filter(task => task.status === 'todo'),
    in_progress: filteredTasks.filter(task => task.status === 'in_progress'),
    review: filteredTasks.filter(task => task.status === 'review'),
    completed: filteredTasks.filter(task => task.status === 'completed'),
    blocked: filteredTasks.filter(task => task.status === 'blocked'),
  };

  const currentTasksByStatus = Object.keys(localTasksByStatus).length > 0 ? localTasksByStatus : tasksByStatus;

  // Debug logging
  console.log('Tasks debug:', {
    totalTasks: tasks.length,
    filteredTasks: filteredTasks.length,
    sampleTask: filteredTasks[0],
    tasksByStatus,
    currentTasksByStatus,
    localTasksByStatusLength: Object.keys(localTasksByStatus).length
  });

  // Update local state when filtered tasks change
  React.useEffect(() => {
    const totalLocalTasks = Object.values(localTasksByStatus).flat().length;
    if (totalLocalTasks === 0 && filteredTasks.length > 0) {
      setLocalTasksByStatus({
        todo: filteredTasks.filter(task => task.status === 'todo'),
        in_progress: filteredTasks.filter(task => task.status === 'in_progress'),
        review: filteredTasks.filter(task => task.status === 'review'),
        completed: filteredTasks.filter(task => task.status === 'completed'),
        blocked: filteredTasks.filter(task => task.status === 'blocked'),
      });
    }
  }, [filteredTasks, localTasksByStatus]);

  const handleCreateTask = async (taskData: any) => {
    await createTaskMutation.mutateAsync(taskData);
  };

  const handleUpdateTask = async (taskData: any) => {
    if (!editingTask) return;
    await updateTaskMutation.mutateAsync({
      id: editingTask.id,
      updates: taskData,
    });
  };

  const handleTaskDetailsUpdate = async (updates: any) => {
    if (selectedTask) {
      await updateTaskMutation.mutateAsync({
        id: selectedTask.id,
        updates,
      });
    }
  };

  const handleTaskView = (task: TaskWithDetails) => {
    setSelectedTask(task);
    setTaskDetailsOpen(true);
  };

  const handleSaveSearch = (name: string, filters: AdvancedSearchFiltersType) => {
    const newSearch = {
      id: Date.now().toString(),
      name,
      filters,
    };
    setSavedSearches(prev => [...prev, newSearch]);
    // In a real app, this would save to the backend
  };

  const handleLoadSearch = (filters: AdvancedSearchFiltersType) => {
    setAdvancedFilters(filters);
  };

  const handleDeleteSearch = (id: string) => {
    setSavedSearches(prev => prev.filter(search => search.id !== id));
    // In a real app, this would delete from the backend
  };

  const handleUseTemplate = (template: any) => {
    setEditingTask({
      id: 0, // Temporary ID for new task
      title: template.title_template,
      description: template.description_template,
      priority: template.priority,
      status: 'todo',
      project_id: projects[0]?.id || null,
      assignee_id: null,
      dependency_id: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      start_date: null,
      end_date: null,
    } as any);
  };

  const handleDeleteTask = async (taskId: number) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTaskMutation.mutateAsync(taskId);
    }
  };

  const handleStatusChange = async (taskId: number, status: TaskStatus) => {
    await updateTaskMutation.mutateAsync({
      id: taskId,
      updates: { status },
    });
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverATask = over.data.current?.type === 'Task';
    const isOverAColumn = over.data.current?.type === 'Column';

    if (!isActiveATask) return;

    const activeTask = active.data.current?.task as TaskWithDetails;

    // Handle task reordering within the same column
    if (isActiveATask && isOverATask) {
      const overTask = over.data.current?.task as TaskWithDetails;
      
      // Only allow reordering within the same status
      if (activeTask.status === overTask.status) {
        const activeStatus = activeTask.status as string;
        const activeIndex = currentTasksByStatus[activeStatus].findIndex(task => task.id === activeTask.id);
        const overIndex = currentTasksByStatus[activeStatus].findIndex(task => task.id === overTask.id);
        
        if (activeIndex !== overIndex) {
          setLocalTasksByStatus(prev => ({
            ...prev,
            [activeStatus]: arrayMove(prev[activeStatus], activeIndex, overIndex)
          }));
        }
      }
      return;
    }

    // Handle moving tasks between columns
    if (isActiveATask && isOverAColumn) {
      const newStatus = over.data.current?.status as TaskStatus;
      
      if (activeTask && activeTask.status !== newStatus) {
        // Update local state immediately for smooth UI
        setLocalTasksByStatus(prev => {
          const oldStatus = activeTask.status as string;
          const newTasks = { ...prev };
          
          // Remove from old column
          newTasks[oldStatus] = newTasks[oldStatus].filter(task => task.id !== activeTask.id);
          
          // Add to new column
          const updatedTask = { ...activeTask, status: newStatus };
          newTasks[newStatus] = [...newTasks[newStatus], updatedTask];
          
          return newTasks;
        });
        
        // Update in database
        handleStatusChange(activeTask.id, newStatus);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    // No additional logic needed as handleDragOver handles everything
  };

  const statusColumns = [
    { id: 'todo', label: 'To Do', color: 'bg-gray-50' },
    { id: 'in_progress', label: 'In Progress', color: 'bg-blue-50' },
    { id: 'review', label: 'Review', color: 'bg-yellow-50' },
    { id: 'completed', label: 'Completed', color: 'bg-green-50' },
    { id: 'blocked', label: 'Blocked', color: 'bg-red-50' },
  ];

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
                // If there's no history to go back to, navigate to dashboard
                if (window.history.length <= 1) {
                  window.location.href = '/dashboard';
                } else {
                  window.history.back();
                }
              }}
              className="flex items-center space-x-2 bg-white/30 backdrop-blur-sm hover:bg-white/50 transition-all duration-300 border border-white/20 text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>
          
          <div className="relative bg-white/20 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/30">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl backdrop-blur-sm border border-white/20 mb-4 group-hover:scale-110 transition-transform duration-300">
              <ListIcon className="h-10 w-10 text-blue-600 group-hover:rotate-6 transition-transform duration-300" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                Tasks
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Manage and track project tasks with powerful collaboration tools and real-time updates
              </p>
            </div>
            
            <div className="flex justify-center gap-4 pt-6">
            <ExportDialog 
              tasks={filteredTasks.map(task => ({
                id: task.id,
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                assignee: task.assignee,
                project: task.project,
                start_date: task.start_date,
                end_date: task.end_date,
                created_at: task.created_at,
                updated_at: task.updated_at,
              }))}
              title="Export Tasks"
            />
            
            <TaskForm
              projects={projects}
              teamMembers={teamMembers}
              availableTasks={tasks.map(t => ({ id: t.id, title: t.title || 'Untitled', status: t.status || 'todo' }))}
              onSubmit={handleCreateTask}
            >
              <Button className="group text-lg px-10 py-4 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold relative overflow-hidden">
                <span className="relative z-10 flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
              </Button>
            </TaskForm>
            
            <TaskTemplateManager onUseTemplate={handleUseTemplate} />
            </div>
          </div>
        </div>

        {/* Separate Edit Dialog */}
        <TaskForm
          projects={projects}
          teamMembers={teamMembers}
          availableTasks={tasks.map(t => ({ id: t.id, title: t.title || 'Untitled', status: t.status || 'todo' }))}
          onSubmit={editingTask?.id === 0 ? handleCreateTask : handleUpdateTask}
          task={editingTask?.id === 0 ? null : editingTask}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) {
              setEditingTask(null);
            }
          }}
        />

        {/* Quick Filters */}
        <Card className="mb-6 bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filters</CardTitle>
              <Button
                className="group text-lg px-10 py-4 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold relative overflow-hidden"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <span className="relative z-10 flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  {showAdvancedFilters ? 'Simple Filters' : 'Advanced Filters'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={advancedFilters.searchTerm}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-10"
                />
              </div>
              
              <Select 
                value={advancedFilters.selectedProject} 
                onValueChange={(value) => setAdvancedFilters(prev => ({ ...prev, selectedProject: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    {advancedFilters.selectedStatus.length === 0 ? 'All Status' : `${advancedFilters.selectedStatus.length} status`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3">
                  <div className="space-y-2">
                    {['todo', 'in_progress', 'review', 'completed', 'blocked'].map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={status}
                          checked={advancedFilters.selectedStatus.includes(status)}
                          onCheckedChange={(checked) => {
                            const newStatus = checked
                              ? [...advancedFilters.selectedStatus, status]
                              : advancedFilters.selectedStatus.filter(s => s !== status);
                            setAdvancedFilters(prev => ({ ...prev, selectedStatus: newStatus }));
                          }}
                        />
                        <label htmlFor={status} className="text-sm capitalize">
                          {status.replace('_', ' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    {advancedFilters.selectedPriority.length === 0 ? 'All Priority' : `${advancedFilters.selectedPriority.length} priority`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3">
                  <div className="space-y-2">
                    {['low', 'medium', 'high', 'critical'].map((priority) => (
                      <div key={priority} className="flex items-center space-x-2">
                        <Checkbox
                          id={priority}
                          checked={advancedFilters.selectedPriority.includes(priority)}
                          onCheckedChange={(checked) => {
                            const newPriority = checked
                              ? [...advancedFilters.selectedPriority, priority]
                              : advancedFilters.selectedPriority.filter(p => p !== priority);
                            setAdvancedFilters(prev => ({ ...prev, selectedPriority: newPriority }));
                          }}
                        />
                        <label htmlFor={priority} className="text-sm capitalize">{priority}</label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    <Tag className="h-4 w-4 mr-2" />
                    {advancedFilters.selectedLabels.length === 0 ? 'All Labels' : `${advancedFilters.selectedLabels.length} labels`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0">
                  <div className="p-3">
                    <h4 className="font-medium text-sm mb-3">Filter by Labels</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {allLabels.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No labels found</p>
                      ) : (
                        allLabels.map((label) => (
                          <div key={label.label_name} className="flex items-center space-x-2">
                            <Checkbox
                              id={label.label_name}
                              checked={advancedFilters.selectedLabels.includes(label.label_name)}
                              onCheckedChange={(checked) => {
                                const newLabels = checked
                                  ? [...advancedFilters.selectedLabels, label.label_name]
                                  : advancedFilters.selectedLabels.filter(l => l !== label.label_name);
                                setAdvancedFilters(prev => ({ ...prev, selectedLabels: newLabels }));
                              }}
                            />
                            <label
                              htmlFor={label.label_name}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                            >
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: label.label_color }}
                              />
                              {label.label_name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button 
                className="group text-lg px-10 py-4 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold relative overflow-hidden"
                onClick={() => setAdvancedFilters({
                  searchTerm: '',
                  searchFields: ['title', 'description'],
                  selectedProject: 'all',
                  selectedStatus: [],
                  selectedPriority: [],
                  selectedLabels: [],
                  selectedAssignee: 'all',
                  dueDateFrom: undefined,
                  dueDateTo: undefined,
                  createdDateFrom: undefined,
                  createdDateTo: undefined,
                  hasTimeLogged: null,
                  isOverdue: null,
                  quickFilters: [],
                })}
              >
                <span className="relative z-10">Clear All</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <AdvancedSearchFilters
            filters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
            projects={projects}
            teamMembers={teamMembers}
            allLabels={allLabels}
            savedSearches={savedSearches}
            onSaveSearch={handleSaveSearch}
            onLoadSearch={handleLoadSearch}
            onDeleteSearch={handleDeleteSearch}
          />
        )}

        {/* Task Views */}
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px] bg-white/70 backdrop-blur-xl border border-white/20">
            <TabsTrigger value="list" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white">
              <ListIcon className="h-4 w-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="kanban" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white">
              <Grid3X3Icon className="h-4 w-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            {tasksLoading ? (
              <div className="text-center py-8">Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No tasks found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                 {filteredTasks.map((task) => (
                   <TaskItem
                     key={task.id}
                     task={task}
                     onEdit={setEditingTask}
                     onDelete={handleDeleteTask}
                     onStatusChange={handleStatusChange}
                     onView={handleTaskView}
                   />
                 ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="kanban" className="mt-6">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[600px]">
                {statusColumns.map((column) => (
                  <KanbanColumn
                    key={column.id}
                    id={column.id}
                    title={column.label}
                    tasks={currentTasksByStatus[column.id as keyof typeof currentTasksByStatus]}
                    color={column.color}
                    onEditTask={setEditingTask}
                  />
                ))}
              </div>
              
              <DragOverlay>
                {activeTask ? (
                  <KanbanTaskCard task={activeTask} onEdit={() => {}} />
                ) : null}
              </DragOverlay>
            </DndContext>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <TimeReportingDashboard />
          </TabsContent>
        </Tabs>

        {/* Task Details Dialog */}
        <TaskDetailsDialog
          task={selectedTask}
          open={taskDetailsOpen}
          onOpenChange={setTaskDetailsOpen}
          onTaskUpdate={handleTaskDetailsUpdate}
        />
      </main>
      </div>
    </AppLayout>
  );
};

export default Tasks;