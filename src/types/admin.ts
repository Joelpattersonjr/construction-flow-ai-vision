export interface TeamMember {
  id: string;
  full_name: string;
  email?: string;
  job_title: string;
  company_role: 'company_admin' | 'company_member';
  updated_at: string;
  custom_fields?: Record<string, any>;
}

export interface CustomField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  field_options: string[];
  is_required: boolean;
  display_order: number;
}