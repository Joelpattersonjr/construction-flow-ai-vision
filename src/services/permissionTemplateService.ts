import { supabase } from '@/integrations/supabase/client';

export interface PermissionTemplate {
  id: string;
  name: string;
  description?: string;
  role: string;
  permissions: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
  is_default: boolean;
  company_id: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePermissionTemplateData {
  name: string;
  description?: string;
  role: string;
  permissions: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
  is_default?: boolean;
}

export const permissionTemplateService = {
  // Get all templates for the current user's company
  async getCompanyTemplates(): Promise<PermissionTemplate[]> {
    const { data, error } = await supabase
      .from('permission_templates')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    // Type-safe permission handling
    const typedTemplates = (data || []).map(template => ({
      ...template,
      permissions: template.permissions as { read: boolean; write: boolean; admin: boolean; }
    }));
    
    return typedTemplates;
  },

  // Create a new permission template
  async createTemplate(templateData: CreatePermissionTemplateData): Promise<PermissionTemplate> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser?.user) throw new Error('User not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', currentUser.user.id)
      .single();

    if (!profile?.company_id) throw new Error('User not associated with a company');

    const { data, error } = await supabase
      .from('permission_templates')
      .insert({
        ...templateData,
        company_id: profile.company_id,
        created_by: currentUser.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    
    // Type-safe permission handling
    const typedData = {
      ...data,
      permissions: data.permissions as { read: boolean; write: boolean; admin: boolean; }
    };
    
    return typedData;
  },

  // Update an existing permission template
  async updateTemplate(templateId: string, templateData: Partial<CreatePermissionTemplateData>): Promise<PermissionTemplate> {
    const { data, error } = await supabase
      .from('permission_templates')
      .update({
        ...templateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;
    
    // Type-safe permission handling
    const typedData = {
      ...data,
      permissions: data.permissions as { read: boolean; write: boolean; admin: boolean; }
    };
    
    return typedData;
  },

  // Delete a permission template
  async deleteTemplate(templateId: string): Promise<void> {
    const { error } = await supabase
      .from('permission_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;
  },

  // Set a template as default (and unset others for the same role)
  async setAsDefault(templateId: string, role: string): Promise<void> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser?.user) throw new Error('User not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', currentUser.user.id)
      .single();

    if (!profile?.company_id) throw new Error('User not associated with a company');

    // First unset all defaults for this role
    await supabase
      .from('permission_templates')
      .update({ is_default: false })
      .eq('company_id', profile.company_id)
      .eq('role', role);

    // Then set the selected template as default
    const { error } = await supabase
      .from('permission_templates')
      .update({ is_default: true })
      .eq('id', templateId);

    if (error) throw error;
  },

  // Get default template for a role
  async getDefaultTemplate(role: string): Promise<PermissionTemplate | null> {
    const { data, error } = await supabase
      .from('permission_templates')
      .select('*')
      .eq('role', role)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) return null;
    
    // Type-safe permission handling
    const typedData = {
      ...data,
      permissions: data.permissions as { read: boolean; write: boolean; admin: boolean; }
    };
    
    return typedData;
  },

  // Apply template permissions to a project member
  async applyTemplateToMember(projectId: string, userId: string, templateId: string): Promise<void> {
    const { data: template, error: templateError } = await supabase
      .from('permission_templates')
      .select('role, permissions')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;

    const { error } = await supabase
      .from('project_members_enhanced')
      .update({
        role: template.role,
        permissions: template.permissions,
        updated_at: new Date().toISOString(),
      })
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) throw error;
  },
};