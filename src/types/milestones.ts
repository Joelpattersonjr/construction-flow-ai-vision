export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  milestone_type: 'regulatory' | 'internal' | 'client' | 'contract';
  importance_level: 'low' | 'medium' | 'high' | 'critical';
  target_date: string;
  actual_date?: string;
  status: 'pending' | 'at_risk' | 'completed' | 'overdue' | 'cancelled';
  dependencies: string[];
  approval_required: boolean;
  approval_status: 'not_required' | 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  compliance_requirements: string[];
  evidence_required: boolean;
  evidence_attachments: string[];
  weather_sensitive: boolean;
  buffer_days: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
  health_score?: number;
}

export interface MilestoneAlert {
  id: string;
  milestone_id: string;
  alert_type: 'warning' | 'critical' | 'weather' | 'dependency';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggered_at: string;
  resolved_at?: string;
  notified_users: string[];
  alert_data: Record<string, any>;
}

export interface MilestoneTemplate {
  id: string;
  company_id: number;
  name: string;
  description?: string;
  project_type: string;
  template_data: MilestoneTemplateItem[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MilestoneTemplateItem {
  title: string;
  description?: string;
  milestone_type: ProjectMilestone['milestone_type'];
  importance_level: ProjectMilestone['importance_level'];
  days_from_start: number;
  approval_required: boolean;
  evidence_required: boolean;
  weather_sensitive: boolean;
  buffer_days: number;
  compliance_requirements: string[];
  dependencies?: string[];
}

export interface MilestoneAnalytics {
  total_milestones: number;
  completed_milestones: number;
  overdue_milestones: number;
  at_risk_milestones: number;
  average_completion_time: number;
  completion_rate: number;
  health_score_trend: { date: string; score: number }[];
  milestone_types_breakdown: { type: string; count: number }[];
}

export interface MilestoneWithProject extends ProjectMilestone {
  project?: {
    id: string;
    name: string;
    status: string;
  };
}