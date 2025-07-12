import { supabase } from "@/integrations/supabase/client";
import { TaskTimeEntry } from "@/types/tasks";

export const taskTimeService = {
  // Get time entries for a task
  async getTaskTimeEntries(taskId: number): Promise<TaskTimeEntry[]> {
    const { data, error } = await supabase
      .from('task_time_entries')
      .select(`
        *,
        user:profiles(id, full_name, email)
      `)
      .eq('task_id', taskId)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as TaskTimeEntry[];
  },

  // Start a new time entry
  async startTimeEntry(taskId: number, description?: string): Promise<TaskTimeEntry> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Check if there's already an active timer for this user
    const { data: activeEntry } = await supabase
      .from('task_time_entries')
      .select('*')
      .eq('user_id', user.user.id)
      .is('end_time', null)
      .single();

    if (activeEntry) {
      throw new Error('You already have an active timer running. Please stop it first.');
    }

    const { data, error } = await supabase
      .from('task_time_entries')
      .insert({
        task_id: taskId,
        user_id: user.user.id,
        description: description || null,
        start_time: new Date().toISOString(),
      })
      .select(`
        *,
        user:profiles(id, full_name, email)
      `)
      .single();

    if (error) throw error;
    return data as unknown as TaskTimeEntry;
  },

  // Stop a time entry
  async stopTimeEntry(entryId: string): Promise<TaskTimeEntry> {
    const { data, error } = await supabase
      .from('task_time_entries')
      .update({
        end_time: new Date().toISOString(),
      })
      .eq('id', entryId)
      .select(`
        *,
        user:profiles(id, full_name, email)
      `)
      .single();

    if (error) throw error;
    return data as unknown as TaskTimeEntry;
  },

  // Update time entry description
  async updateTimeEntry(entryId: string, updates: Partial<TaskTimeEntry>): Promise<TaskTimeEntry> {
    const { data, error } = await supabase
      .from('task_time_entries')
      .update(updates)
      .eq('id', entryId)
      .select(`
        *,
        user:profiles(id, full_name, email)
      `)
      .single();

    if (error) throw error;
    return data as unknown as TaskTimeEntry;
  },

  // Delete time entry
  async deleteTimeEntry(entryId: string): Promise<void> {
    const { error } = await supabase
      .from('task_time_entries')
      .delete()
      .eq('id', entryId);

    if (error) throw error;
  },

  // Get active time entry for current user
  async getActiveTimeEntry(): Promise<TaskTimeEntry | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    const { data, error } = await supabase
      .from('task_time_entries')
      .select(`
        *,
        user:profiles(id, full_name, email),
        task:tasks(id, title, project:projects(name))
      `)
      .eq('user_id', user.user.id)
      .is('end_time', null)
      .maybeSingle();

    if (error) throw error;
    return data as unknown as TaskTimeEntry;
  },

  // Format duration from seconds to readable string
  formatDuration(seconds: number | null): string {
    if (!seconds) return '0m';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  },

  // Calculate total time spent on task
  async getTaskTotalTime(taskId: number): Promise<number> {
    const { data, error } = await supabase
      .from('task_time_entries')
      .select('duration_seconds')
      .eq('task_id', taskId)
      .not('duration_seconds', 'is', null);

    if (error) throw error;
    
    return (data || []).reduce((total, entry) => total + (entry.duration_seconds || 0), 0);
  },

  // Get user's time summary for a date range
  async getUserTimeStats(startDate: Date, endDate: Date): Promise<{
    totalHours: number;
    entriesCount: number;
    taskBreakdown: Array<{
      taskId: number;
      taskTitle: string;
      totalSeconds: number;
    }>;
  }> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('task_time_entries')
      .select(`
        duration_seconds,
        task:tasks(id, title)
      `)
      .eq('user_id', user.user.id)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .not('duration_seconds', 'is', null);

    if (error) throw error;

    const entries = data || [];
    const totalSeconds = entries.reduce((sum, entry) => sum + (entry.duration_seconds || 0), 0);
    const totalHours = totalSeconds / 3600;

    // Group by task
    const taskGroups = entries.reduce((acc, entry) => {
      const taskId = (entry.task as any)?.id;
      const taskTitle = (entry.task as any)?.title || 'Unknown Task';
      
      if (!acc[taskId]) {
        acc[taskId] = {
          taskId,
          taskTitle,
          totalSeconds: 0,
        };
      }
      acc[taskId].totalSeconds += entry.duration_seconds || 0;
      return acc;
    }, {} as Record<number, any>);

    return {
      totalHours,
      entriesCount: entries.length,
      taskBreakdown: Object.values(taskGroups),
    };
  },
};