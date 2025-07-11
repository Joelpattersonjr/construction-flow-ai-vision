import { supabase } from "@/integrations/supabase/client";
import { emailNotificationService } from "./emailNotificationService";

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

    // Send comment notifications
    try {
      await this.sendCommentNotifications(taskId, data, data.user);
    } catch (emailError) {
      console.error('Failed to send comment notifications:', emailError);
      // Don't fail comment creation if email fails
    }

    return data as TaskComment;
  },

  async sendCommentNotifications(taskId: number, comment: TaskComment, author: any) {
    try {
      // Get task details
      const { data: task } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:profiles!fk_tasks_assignee_id(id, full_name, email),
          project:projects(id, name)
        `)
        .eq('id', taskId)
        .single();

      if (!task) return;

      // Send notification to assignee if comment is not from them
      if (task.assignee && task.assignee.id !== author.id) {
        const shouldSend = await emailNotificationService.shouldSendNotification(
          task.assignee.id,
          'task_comment'
        );
        
        if (shouldSend) {
          await emailNotificationService.sendTaskCommentNotification(
            task,
            comment,
            task.assignee,
            author,
            task.project
          );
        }
      }

      // Send notification to task creator if comment is not from them and they're not the assignee
      if (task.created_by && task.created_by !== author.id && task.created_by !== task.assignee?.id) {
        const { data: creator } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', task.created_by)
          .single();

        if (creator) {
          const shouldSend = await emailNotificationService.shouldSendNotification(
            creator.id,
            'task_comment'
          );
          
          if (shouldSend) {
            await emailNotificationService.sendTaskCommentNotification(
              task,
              comment,
              creator,
              author,
              task.project
            );
          }
        }
      }
    } catch (error) {
      console.error('Error sending comment notifications:', error);
      throw error;
    }
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