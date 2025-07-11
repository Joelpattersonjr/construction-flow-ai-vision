import { supabase } from "@/integrations/supabase/client";

export interface TaskComment {
  id: string;
  task_id: number;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

export const taskCommentsService = {
  async getTaskComments(taskId: number): Promise<TaskComment[]> {
    const { data, error } = await supabase
      .from('task_comments')
      .select(`
        *,
        user:profiles(id, full_name, email)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as TaskComment[];
  },

  async createComment(taskId: number, content: string): Promise<TaskComment> {
    const { data, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        content,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select(`
        *,
        user:profiles(id, full_name, email)
      `)
      .single();

    if (error) throw error;
    return data as TaskComment;
  },

  async updateComment(commentId: string, content: string): Promise<void> {
    const { error } = await supabase
      .from('task_comments')
      .update({ content })
      .eq('id', commentId);

    if (error) throw error;
  },

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
  }
};