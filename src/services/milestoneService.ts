import { supabase } from "@/integrations/supabase/client";
import { ProjectMilestone, MilestoneAlert, MilestoneTemplate, MilestoneAnalytics } from "@/types/milestones";

export const milestoneService = {
  // Milestone CRUD operations
  async getProjectMilestones(projectId: string): Promise<ProjectMilestone[]> {
    const { data, error } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('target_date', { ascending: true });

    if (error) throw error;
    return (data || []) as ProjectMilestone[];
  },

  async createMilestone(milestone: Omit<ProjectMilestone, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<ProjectMilestone> {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('project_milestones')
      .insert({
        ...milestone,
        created_by: user.data.user?.id!
      })
      .select()
      .single();

    if (error) throw error;
    return data as ProjectMilestone;
  },

  async updateMilestone(id: string, updates: Partial<Omit<ProjectMilestone, 'id' | 'created_at' | 'created_by'>>): Promise<ProjectMilestone> {
    const { data, error } = await supabase
      .from('project_milestones')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ProjectMilestone;
  },

  async deleteMilestone(id: string): Promise<void> {
    const { error } = await supabase
      .from('project_milestones')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Milestone health and analytics
  async getMilestoneHealth(milestoneId: string): Promise<number> {
    const { data, error } = await supabase
      .rpc('calculate_milestone_health', { milestone_id_param: milestoneId });

    if (error) throw error;
    return data || 0;
  },

  async checkMilestoneDependencies(milestoneId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('check_milestone_dependencies', { milestone_id_param: milestoneId });

    if (error) throw error;
    return data || false;
  },

  async getMilestoneAnalytics(projectId: string): Promise<MilestoneAnalytics> {
    const { data: milestones, error } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('project_id', projectId);

    if (error) throw error;

    const total = milestones?.length || 0;
    const completed = milestones?.filter(m => m.status === 'completed').length || 0;
    const overdue = milestones?.filter(m => m.status === 'overdue').length || 0;
    const atRisk = milestones?.filter(m => m.status === 'at_risk').length || 0;

    // Calculate completion rate
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    // Calculate milestone types breakdown
    const typesBreakdown = milestones?.reduce((acc, milestone) => {
      const existing = acc.find(item => item.type === milestone.milestone_type);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ type: milestone.milestone_type, count: 1 });
      }
      return acc;
    }, [] as { type: string; count: number }[]) || [];

    return {
      total_milestones: total,
      completed_milestones: completed,
      overdue_milestones: overdue,
      at_risk_milestones: atRisk,
      average_completion_time: 0, // TODO: Calculate based on actual completion times
      completion_rate: completionRate,
      health_score_trend: [], // TODO: Implement trend tracking
      milestone_types_breakdown: typesBreakdown
    };
  },

  // Alert management
  async getMilestoneAlerts(milestoneId: string): Promise<MilestoneAlert[]> {
    const { data, error } = await supabase
      .from('milestone_alerts')
      .select('*')
      .eq('milestone_id', milestoneId)
      .order('triggered_at', { ascending: false });

    if (error) throw error;
    return (data || []) as MilestoneAlert[];
  },

  async createAlert(alert: Omit<MilestoneAlert, 'id' | 'triggered_at'>): Promise<MilestoneAlert> {
    const { data, error } = await supabase
      .from('milestone_alerts')
      .insert(alert)
      .select()
      .single();

    if (error) throw error;
    return data as MilestoneAlert;
  },

  async resolveAlert(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('milestone_alerts')
      .update({ resolved_at: new Date().toISOString() })
      .eq('id', alertId);

    if (error) throw error;
  },

  // Template management
  async getMilestoneTemplates(): Promise<any[]> {
    const { data, error } = await supabase
      .from('milestone_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async createTemplate(template: { name: string; description?: string; project_type: string; template_data: any; company_id: number; is_active: boolean }): Promise<any> {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('milestone_templates')
      .insert({
        ...template,
        template_data: JSON.stringify(template.template_data),
        created_by: user.data.user?.id!
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async applyTemplate(projectId: string, templateId: string, projectStartDate: string): Promise<void> {
    // Get template data
    const { data: template, error: templateError } = await supabase
      .from('milestone_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;

    // Create milestones from template
    const templateData = Array.isArray(template.template_data) ? template.template_data : [];
    const user = await supabase.auth.getUser();
    
    const milestones = templateData.map((item: any) => {
      const targetDate = new Date(projectStartDate);
      targetDate.setDate(targetDate.getDate() + item.days_from_start);

      return {
        project_id: projectId,
        title: item.title,
        description: item.description,
        milestone_type: item.milestone_type,
        importance_level: item.importance_level,
        target_date: targetDate.toISOString().split('T')[0],
        approval_required: item.approval_required,
        evidence_required: item.evidence_required,
        weather_sensitive: item.weather_sensitive,
        buffer_days: item.buffer_days,
        compliance_requirements: JSON.stringify(item.compliance_requirements || []),
        dependencies: JSON.stringify(item.dependencies || []),
        created_by: user.data.user?.id!
      };
    });

    const { error } = await supabase
      .from('project_milestones')
      .insert(milestones);

    if (error) throw error;
  },

  // Batch operations
  async updateMilestoneStatuses(projectId: string): Promise<void> {
    // Get all milestones for the project
    const milestones = await this.getProjectMilestones(projectId);
    const today = new Date().toISOString().split('T')[0];

    const updates = milestones.map(milestone => {
      let newStatus = milestone.status;

      // Check if milestone is overdue
      if (milestone.target_date < today && milestone.status !== 'completed') {
        newStatus = 'overdue';
      }
      // Check if milestone is at risk (within buffer days)
      else if (milestone.status === 'pending') {
        const targetDate = new Date(milestone.target_date);
        const bufferDate = new Date(targetDate);
        bufferDate.setDate(bufferDate.getDate() - milestone.buffer_days);
        
        if (new Date(today) >= bufferDate) {
          newStatus = 'at_risk';
        }
      }

      return { id: milestone.id, status: newStatus };
    });

    // Batch update statuses
    for (const update of updates) {
      if (update.status !== milestones.find(m => m.id === update.id)?.status) {
        await this.updateMilestone(update.id, { status: update.status });
      }
    }
  },

  // Weather integration
  async checkWeatherImpacts(projectId: string): Promise<void> {
    const milestones = await this.getProjectMilestones(projectId);
    const weatherSensitiveMilestones = milestones.filter(m => m.weather_sensitive);

    // TODO: Integrate with weather service to check for adverse conditions
    // For now, this is a placeholder for the weather integration
    for (const milestone of weatherSensitiveMilestones) {
      // Example: Check if there's a severe weather alert for the milestone date
      // and create an alert if needed
    }
  }
};