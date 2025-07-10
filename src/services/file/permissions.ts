import { supabase } from '@/integrations/supabase/client';

/**
 * Check if current user has write permissions for a project
 */
export async function hasWritePermission(projectId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('project_members_enhanced')
      .select('permissions')
      .eq('project_id', projectId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (error || !data) {
      // If no specific permissions found, check if user is project owner or company admin
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('owner_id, company_id')
        .eq('id', projectId)
        .single();

      if (projectError || !project) return false;

      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) return false;

      // Check if user is project owner
      if (project.owner_id === currentUser.id) return true;

      // Check if user is company admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_role')
        .eq('id', currentUser.id)
        .single();

      return !profileError && profile?.company_role === 'company_admin';
    }

    // Check permissions JSON
    const permissions = data.permissions as any;
    return permissions?.write === true || permissions?.admin === true;
  } catch (error) {
    console.error('Error checking write permissions:', error);
    return false;
  }
}