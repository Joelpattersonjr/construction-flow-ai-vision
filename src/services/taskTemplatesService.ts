import { supabase } from "@/integrations/supabase/client";

export interface TaskTemplate {
  id: string;
  name: string;
  title_template: string;
  description_template: string | null;
  priority: string | null;
  estimated_hours: number | null;
  tags: string[] | null;
  company_id: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const taskTemplatesService = {
  async getCompanyTemplates(): Promise<TaskTemplate[]> {
    const { data, error } = await supabase
      .from('task_templates')
      .select('*')
      .order('name');

    if (error) throw error;
    return (data || []) as TaskTemplate[];
  },

  async createTemplate(template: Partial<TaskTemplate>): Promise<TaskTemplate> {
    const { data: user } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.user?.id)
      .single();

    if (!template.name || !template.title_template) {
      throw new Error('Name and title template are required');
    }

    const templateData = {
      name: template.name,
      title_template: template.title_template,
      description_template: template.description_template || null,
      priority: template.priority || null,
      estimated_hours: template.estimated_hours || null,
      tags: template.tags || null,
      company_id: profile?.company_id,
      created_by: user.user?.id,
    };

    const { data, error } = await supabase
      .from('task_templates')
      .insert(templateData)
      .select()
      .single();

    if (error) throw error;
    return data as TaskTemplate;
  },

  async updateTemplate(id: string, updates: Partial<TaskTemplate>): Promise<TaskTemplate> {
    const { data, error } = await supabase
      .from('task_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as TaskTemplate;
  },

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('task_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};