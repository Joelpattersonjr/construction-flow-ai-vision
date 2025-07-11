import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, ListIcon, Grid3X3Icon, EditIcon } from 'lucide-react';

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
import { DragDropKanban } from '@/components/tasks/DragDropKanban';
import { taskService } from '@/services/taskService';
import { TaskWithDetails, TaskStatus, TaskPriority } from '@/types/tasks';
import { supabase } from '@/integrations/supabase/client';

const Tasks = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Add label mutation
  const addLabelMutation = useMutation({
    mutationFn: ({ taskId, name, color }: { taskId: number; name: string; color: string }) =>
      taskService.addTaskLabel(taskId, name, color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Label added successfully!' });
    },
    onError: (error) => {
      toast({
        title: 'Error adding label',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Remove label mutation  
  const removeLabelMutation = useMutation({
    mutationFn: (labelId: string) => taskService.removeTaskLabel(labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Label removed successfully!' });
    },
    onError: (error) => {
      toast({
        title: 'Error removing label',
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

  const handleAddLabel = async (taskId: number, name: string, color: string) => {
    await addLabelMutation.mutateAsync({ taskId, name, color });
  };

  const handleRemoveLabel = async (labelId: string) => {
    await removeLabelMutation.mutateAsync(labelId);
  };

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
          
          <TaskForm
            projects={projects}
            teamMembers={teamMembers}
            onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
            task={editingTask}
          >
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </TaskForm>
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
                    onAddLabel={handleAddLabel}
                    onRemoveLabel={handleRemoveLabel}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="kanban" className="mt-6">
            <DragDropKanban
              tasks={filteredTasks}
              onStatusChange={handleStatusChange}
              onEditTask={setEditingTask}
              onAddLabel={handleAddLabel}
              onRemoveLabel={handleRemoveLabel}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Tasks;