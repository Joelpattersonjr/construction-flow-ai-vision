import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, ListIcon, Grid3X3Icon, EditIcon } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import AppHeader from '@/components/navigation/AppHeader';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskItem } from '@/components/tasks/TaskItem';
import { TaskTemplateManager } from '@/components/tasks/TaskTemplateManager';
import { TaskDetailsDialog } from '@/components/tasks/TaskDetailsDialog';
import { taskService } from '@/services/taskService';
import { TaskWithDetails, TaskStatus, TaskPriority } from '@/types/tasks';
import { supabase } from '@/integrations/supabase/client';
import { KanbanColumn } from '@/components/tasks/KanbanColumn';
import { KanbanTaskCard } from '@/components/tasks/KanbanTaskCard';
import { ExportDialog } from '@/components/export/ExportDialog';

const Tasks = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);
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

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = !searchTerm || 
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProject = !selectedProject || selectedProject === 'all' || task.project_id === selectedProject;
    const matchesStatus = !selectedStatus || selectedStatus === 'all' || task.status === selectedStatus;
    const matchesPriority = !selectedPriority || selectedPriority === 'all' || task.priority === selectedPriority;

    return matchesSearch && matchesProject && matchesStatus && matchesPriority;
  });

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
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">
              Manage and track project tasks
            </p>
          </div>
          
          <div className="flex gap-2">
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
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </TaskForm>
            
            <TaskTemplateManager onUseTemplate={handleUseTemplate} />
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
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedProject} onValueChange={setSelectedProject}>
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

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedProject('all');
                  setSelectedStatus('all');
                  setSelectedPriority('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Task Views */}
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <ListIcon className="h-4 w-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              <Grid3X3Icon className="h-4 w-4" />
              Kanban Board
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
  );
};

export default Tasks;