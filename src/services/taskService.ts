import { supabase } from "@/integrations/supabase/client";
import { Task, TaskWithDetails, TaskLabel } from "@/types/tasks";

export const taskService = {
  // Get all tasks for a project
  async getProjectTasks(projectId: string): Promise<TaskWithDetails[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles(id, full_name, email),
        project:projects(id, name)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as TaskWithDetails[];
  },

  // Get all tasks for current user's company
  async getCompanyTasks(): Promise<TaskWithDetails[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles(id, full_name, email),
        project:projects(id, name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as TaskWithDetails[];
  },

  // Create a new task
  async createTask(task: Partial<Task>): Promise<Task> {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        created_by: user.user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  // Update a task
  async updateTask(id: number, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  // Delete a task
  async deleteTask(id: number): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get task labels
  async getTaskLabels(taskId: number): Promise<TaskLabel[]> {
    const { data, error } = await supabase
      .from('task_labels')
      .select('*')
      .eq('task_id', taskId);

    if (error) throw error;
    return data || [];
  },

  // Add label to task
  async addTaskLabel(taskId: number, labelName: string, labelColor?: string): Promise<TaskLabel> {
    const { data, error } = await supabase
      .from('task_labels')
      .insert({
        task_id: taskId,
        label_name: labelName,
        label_color: labelColor || '#3b82f6',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remove label from task
  async removeTaskLabel(labelId: string): Promise<void> {
    const { error } = await supabase
      .from('task_labels')
      .delete()
      .eq('id', labelId);

    if (error) throw error;
  }
};