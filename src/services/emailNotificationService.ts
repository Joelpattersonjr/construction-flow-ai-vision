import { supabase } from "@/integrations/supabase/client";

export interface NotificationData {
  type: 'task_assignment' | 'due_date_reminder' | 'project_update' | 'task_comment';
  recipient_email: string;
  recipient_name: string;
  data: {
    task?: {
      id: number;
      title: string;
      description?: string;
      due_date?: string;
      priority?: string;
    };
    project?: {
      id: string;
      name: string;
    };
    assigner?: {
      name: string;
      email: string;
    };
    comment?: {
      content: string;
      author: string;
    };
    app_url?: string;
  };
}

export const emailNotificationService = {
  // Send email notification
  async sendNotification(notification: NotificationData) {
    try {
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          ...notification,
          data: {
            ...notification.data,
            app_url: window.location.origin
          }
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending email notification:', error);
      throw error;
    }
  },

  // Send task assignment notification
  async sendTaskAssignmentNotification(task: any, assignee: any, assigner: any, project: any) {
    const notification: NotificationData = {
      type: 'task_assignment',
      recipient_email: assignee.email,
      recipient_name: assignee.full_name || assignee.email,
      data: {
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          due_date: task.end_date,
          priority: task.priority
        },
        project: {
          id: project.id,
          name: project.name
        },
        assigner: {
          name: assigner.full_name || assigner.email,
          email: assigner.email
        }
      }
    };

    return this.sendNotification(notification);
  },

  // Send due date reminder
  async sendDueDateReminder(task: any, assignee: any, project: any) {
    const notification: NotificationData = {
      type: 'due_date_reminder',
      recipient_email: assignee.email,
      recipient_name: assignee.full_name || assignee.email,
      data: {
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          due_date: task.end_date,
          priority: task.priority
        },
        project: {
          id: project.id,
          name: project.name
        }
      }
    };

    return this.sendNotification(notification);
  },

  // Send task comment notification
  async sendTaskCommentNotification(task: any, comment: any, recipient: any, author: any, project: any) {
    // Don't send notification to comment author
    if (recipient.id === author.id) return;

    const notification: NotificationData = {
      type: 'task_comment',
      recipient_email: recipient.email,
      recipient_name: recipient.full_name || recipient.email,
      data: {
        task: {
          id: task.id,
          title: task.title,
          description: task.description
        },
        project: {
          id: project.id,
          name: project.name
        },
        comment: {
          content: comment.content,
          author: author.full_name || author.email
        }
      }
    };

    return this.sendNotification(notification);
  },

  // Send project update notification
  async sendProjectUpdateNotification(project: any, recipient: any) {
    const notification: NotificationData = {
      type: 'project_update',
      recipient_email: recipient.email,
      recipient_name: recipient.full_name || recipient.email,
      data: {
        project: {
          id: project.id,
          name: project.name
        }
      }
    };

    return this.sendNotification(notification);
  },

  // Check if user has notifications enabled for a specific type
  async shouldSendNotification(userId: string, notificationType: string): Promise<boolean> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', userId)
        .single();

      if (!profile?.preferences) return true; // Default to enabled

      const prefs = profile.preferences as any;
      
      // Check if email notifications are enabled
      if (!prefs.notifications?.email) return false;
      
      // Check specific notification type
      switch (notificationType) {
        case 'task_assignment':
          return prefs.notifications?.task_assignments !== false;
        case 'due_date_reminder':
          return prefs.notifications?.due_date_reminders !== false;
        case 'project_update':
          return prefs.notifications?.project_updates !== false;
        case 'task_comment':
          return prefs.notifications?.task_assignments !== false; // Use task_assignments setting
        default:
          return true;
      }
    } catch (error) {
      console.error('Error checking notification preferences:', error);
      return true; // Default to enabled on error
    }
  }
};