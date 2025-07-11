import { supabase } from "@/integrations/supabase/client";

export interface TaskActivity {
  id: string;
  task_id: number;
  action_type: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  description: string | null;
  user_id: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

export const taskActivityService = {
  async getTaskActivity(taskId: number): Promise<TaskActivity[]> {
    const { data, error } = await supabase
      .from('task_activity')
      .select(`
        *,
        user:profiles(id, full_name, email)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as TaskActivity[];
  },

  async createActivity(
    taskId: number, 
    actionType: string, 
    description?: string,
    fieldName?: string,
    oldValue?: string,
    newValue?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('task_activity')
      .insert({
        task_id: taskId,
        action_type: actionType,
        field_name: fieldName,
        old_value: oldValue,
        new_value: newValue,
        description,
        user_id: (await supabase.auth.getUser()).data.user?.id
      });

    if (error) throw error;
  }
};