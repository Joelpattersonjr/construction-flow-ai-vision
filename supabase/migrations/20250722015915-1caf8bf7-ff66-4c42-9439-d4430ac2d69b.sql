-- Create tables for the Dynamic Forms & Workflow Module

-- Form templates table
CREATE TABLE public.form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  form_schema JSONB NOT NULL DEFAULT '{}',
  styling_config JSONB DEFAULT '{}',
  is_multi_page BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'general'
);

-- Form submissions table
CREATE TABLE public.form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_template_id UUID NOT NULL REFERENCES public.form_templates(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  submission_data JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'submitted',
  geolocation JSONB,
  attachments JSONB DEFAULT '[]'
);

-- Workflow templates table
CREATE TABLE public.workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_template_id UUID NOT NULL REFERENCES public.form_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  workflow_steps JSONB NOT NULL DEFAULT '[]'
);

-- Workflow instances table (tracks actual workflow executions)
CREATE TABLE public.workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_template_id UUID NOT NULL REFERENCES public.workflow_templates(id) ON DELETE CASCADE,
  form_submission_id UUID NOT NULL REFERENCES public.form_submissions(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completion_data JSONB DEFAULT '{}'
);

-- Workflow step actions table (tracks individual step completions)
CREATE TABLE public.workflow_step_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id UUID NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_taken TEXT, -- 'approved', 'rejected', 'needs_info'
  comments TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Form field data types for dynamic dropdowns
CREATE TABLE public.form_field_data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  data_type TEXT NOT NULL, -- 'projects', 'employees', 'equipment', 'custom'
  query_config JSONB DEFAULT '{}',
  data_values JSONB DEFAULT '[]',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_step_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_field_data_sources ENABLE ROW LEVEL SECURITY;

-- RLS policies for form_templates
CREATE POLICY "Users can view their company form templates"
ON public.form_templates FOR SELECT
USING (company_id = get_my_company_id());

CREATE POLICY "Users can create form templates for their company"
ON public.form_templates FOR INSERT
WITH CHECK (company_id = get_my_company_id() AND created_by = auth.uid());

CREATE POLICY "Users can update their own form templates"
ON public.form_templates FOR UPDATE
USING (company_id = get_my_company_id() AND (created_by = auth.uid() OR current_user_is_admin()));

CREATE POLICY "Admins can delete form templates"
ON public.form_templates FOR DELETE
USING (company_id = get_my_company_id() AND current_user_is_admin());

-- RLS policies for form_submissions
CREATE POLICY "Users can view submissions for their company"
ON public.form_submissions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.form_templates ft
  WHERE ft.id = form_submissions.form_template_id 
  AND ft.company_id = get_my_company_id()
));

CREATE POLICY "Users can create submissions for their company forms"
ON public.form_submissions FOR INSERT
WITH CHECK (
  submitted_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.form_templates ft
    WHERE ft.id = form_submissions.form_template_id 
    AND ft.company_id = get_my_company_id()
  )
);

CREATE POLICY "Users can update their own submissions"
ON public.form_submissions FOR UPDATE
USING (submitted_by = auth.uid() OR current_user_is_admin());

-- RLS policies for workflow_templates
CREATE POLICY "Users can manage workflow templates for their company"
ON public.workflow_templates FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.form_templates ft
  WHERE ft.id = workflow_templates.form_template_id 
  AND ft.company_id = get_my_company_id()
));

-- RLS policies for workflow_instances
CREATE POLICY "Users can view workflow instances for their company"
ON public.workflow_instances FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.form_submissions fs
  JOIN public.form_templates ft ON ft.id = fs.form_template_id
  WHERE fs.id = workflow_instances.form_submission_id 
  AND ft.company_id = get_my_company_id()
));

-- RLS policies for workflow_step_actions
CREATE POLICY "Users can manage workflow step actions for their company"
ON public.workflow_step_actions FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.workflow_instances wi
  JOIN public.form_submissions fs ON fs.id = wi.form_submission_id
  JOIN public.form_templates ft ON ft.id = fs.form_template_id
  WHERE wi.id = workflow_step_actions.workflow_instance_id 
  AND ft.company_id = get_my_company_id()
));

-- RLS policies for form_field_data_sources
CREATE POLICY "Users can manage data sources for their company"
ON public.form_field_data_sources FOR ALL
USING (company_id = get_my_company_id())
WITH CHECK (company_id = get_my_company_id() AND created_by = auth.uid());

-- Create triggers for updated_at
CREATE TRIGGER update_form_templates_updated_at
  BEFORE UPDATE ON public.form_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_form_submissions_updated_at
  BEFORE UPDATE ON public.form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_templates_updated_at
  BEFORE UPDATE ON public.workflow_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_instances_updated_at
  BEFORE UPDATE ON public.workflow_instances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_form_field_data_sources_updated_at
  BEFORE UPDATE ON public.form_field_data_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_form_templates_company_id ON public.form_templates(company_id);
CREATE INDEX idx_form_submissions_template_id ON public.form_submissions(form_template_id);
CREATE INDEX idx_form_submissions_project_id ON public.form_submissions(project_id);
CREATE INDEX idx_workflow_instances_submission_id ON public.workflow_instances(form_submission_id);
CREATE INDEX idx_workflow_step_actions_instance_id ON public.workflow_step_actions(workflow_instance_id);

-- Insert default form field data sources
INSERT INTO public.form_field_data_sources (company_id, name, description, data_type, query_config, created_by)
SELECT 
  c.id,
  'Active Projects',
  'List of all active projects in the company',
  'projects',
  '{"table": "projects", "fields": ["id", "name"], "filters": {"status": "active"}}',
  c.owner_id
FROM public.companies c
WHERE EXISTS (SELECT 1 FROM public.profiles p WHERE p.company_id = c.id)
ON CONFLICT DO NOTHING;