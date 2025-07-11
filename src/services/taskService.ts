import { supabase } from "@/integrations/supabase/client";
import { Task, TaskWithDetails, TaskLabel } from "@/types/tasks";
import { taskActivityService } from "./taskActivityService";

export const taskService = {
  // Get all tasks for a project
  async getProjectTasks(projectId: string): Promise<TaskWithDetails[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!fk_tasks_assignee_id(id, full_name, email),
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
        assignee:profiles!fk_tasks_assignee_id(id, full_name, email),
        project:projects(id, name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as TaskWithDetails[];
  },

  // Create a new task
  async createTask(task: Partial<Task>): Promise<Task> {
    const { data: user } = await supabase.auth.getUser();
    
    const taskData = {
      ...task,
      created_by: user.user?.id,
      assignee_id: task.assignee_id === 'none' ? null : task.assignee_id,
    };
    
    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  // Update a task
  async updateTask(id: number, updates: Partial<Task>): Promise<Task> {
    // Get current task for comparison
    const { data: currentTask } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    const updateData = {
      ...updates,
      assignee_id: updates.assignee_id === 'none' ? null : updates.assignee_id,
    };
    
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Create activity log for significant changes
    if (currentTask) {
      const changes = [];
      if (currentTask.status !== updateData.status && updateData.status) {
        changes.push({
          field: 'status',
          old: currentTask.status,
          new: updateData.status
        });
      }
      if (currentTask.assignee_id !== updateData.assignee_id) {
        changes.push({
          field: 'assignee',
          old: currentTask.assignee_id,
          new: updateData.assignee_id
        });
      }
      if (currentTask.priority !== updateData.priority && updateData.priority) {
        changes.push({
          field: 'priority',
          old: currentTask.priority,
          new: updateData.priority
        });
      }

      // Log each change
      for (const change of changes) {
        await taskActivityService.createActivity(
          id,
          'updated',
          `${change.field} changed`,
          change.field,
          change.old,
          change.new
        );
      }
    }

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