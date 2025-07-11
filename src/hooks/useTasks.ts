import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { taskService } from '@/services/taskService';
import { TaskWithDetails, TaskStatus } from '@/types/tasks';
import { supabase } from '@/integrations/supabase/client';

export const useTasks = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tasks with error handling
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskService.getCompanyTasks(),
    retry: false,
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

  const handleCreateTask = async (taskData: any) => {
    await createTaskMutation.mutateAsync(taskData);
  };

  const handleUpdateTask = async (id: number, taskData: any) => {
    await updateTaskMutation.mutateAsync({
      id,
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

  const handleAddLabel = async (taskId: number, name: string, color: string) => {
    await addLabelMutation.mutateAsync({ taskId, name, color });
  };

  const handleRemoveLabel = async (labelId: string) => {
    await removeLabelMutation.mutateAsync(labelId);
  };

  return {
    // Data
    tasks,
    projects,
    teamMembers,
    tasksLoading,
    tasksError,
    
    // Actions
    handleCreateTask,
    handleUpdateTask,
    handleDeleteTask,
    handleStatusChange,
    handleAddLabel,
    handleRemoveLabel,
  };
};