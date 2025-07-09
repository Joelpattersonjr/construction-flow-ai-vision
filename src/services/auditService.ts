import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  id: string;
  project_id: string;
  user_id: string;
  action_type: string;
  target_user_id?: string | null;
  old_value?: any;
  new_value?: any;
  metadata?: any;
  created_at: string;
  profiles?: {
    full_name: string | null;
  } | null;
  target_profiles?: {
    full_name: string | null;
  } | null;
}

export const auditService = {
  async logActivity(params: {
    projectId: string;
    actionType: 'member_added' | 'member_removed' | 'role_changed' | 'permissions_updated';
    targetUserId?: string;
    oldValue?: any;
    newValue?: any;
    metadata?: any;
  }) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { error } = await supabase
      .from('audit_log')
      .insert({
        project_id: params.projectId,
        user_id: user.user.id,
        action_type: params.actionType,
        target_user_id: params.targetUserId,
        old_value: params.oldValue,
        new_value: params.newValue,
        metadata: params.metadata,
      });

    if (error) {
      console.error('Failed to log audit activity:', error);
    }
  },

  async getProjectAuditLog(projectId: string, limit = 50) {
    const { data, error } = await supabase
      .from('audit_log')
      .select(`
        *,
        profiles:user_id (full_name),
        target_profiles:target_user_id (full_name)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch audit log:', error);
      return [];
    }

    return (data || []) as unknown as AuditLogEntry[];
  },
};