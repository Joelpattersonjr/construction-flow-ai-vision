-- Create enhanced milestone tracking system

-- Create project milestones table
CREATE TABLE public.project_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  milestone_type TEXT NOT NULL DEFAULT 'internal', -- 'regulatory', 'internal', 'client', 'contract'
  importance_level TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  target_date DATE NOT NULL,
  actual_date DATE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'at_risk', 'completed', 'overdue', 'cancelled'
  dependencies JSONB DEFAULT '[]'::JSONB, -- Array of milestone IDs this depends on
  approval_required BOOLEAN DEFAULT false,
  approval_status TEXT DEFAULT 'not_required', -- 'not_required', 'pending', 'approved', 'rejected'
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  compliance_requirements JSONB DEFAULT '[]'::JSONB,
  evidence_required BOOLEAN DEFAULT false,
  evidence_attachments JSONB DEFAULT '[]'::JSONB,
  weather_sensitive BOOLEAN DEFAULT false,
  buffer_days INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Enable RLS
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage milestones for their company projects" 
ON public.project_milestones 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.projects p
  WHERE p.id = project_milestones.project_id 
  AND p.company_id = get_my_company_id()
));

-- Create milestone alerts table
CREATE TABLE public.milestone_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone_id UUID NOT NULL,
  alert_type TEXT NOT NULL, -- 'warning', 'critical', 'weather', 'dependency'
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  notified_users UUID[] DEFAULT ARRAY[]::UUID[],
  alert_data JSONB DEFAULT '{}'::JSONB
);

-- Enable RLS
ALTER TABLE public.milestone_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view alerts for their company milestones" 
ON public.milestone_alerts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.project_milestones pm
  JOIN public.projects p ON p.id = pm.project_id
  WHERE pm.id = milestone_alerts.milestone_id 
  AND p.company_id = get_my_company_id()
));

-- Create milestone templates table
CREATE TABLE public.milestone_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL DEFAULT 'general',
  template_data JSONB NOT NULL DEFAULT '[]'::JSONB, -- Array of milestone definitions
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.milestone_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage milestone templates for their company" 
ON public.milestone_templates 
FOR ALL 
USING (company_id = get_my_company_id())
WITH CHECK (company_id = get_my_company_id() AND created_by = auth.uid());

-- Add milestone tracking to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS milestone_id UUID;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_milestone_task BOOLEAN DEFAULT false;

-- Create foreign key relationships
ALTER TABLE public.project_milestones 
ADD CONSTRAINT fk_milestone_project 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.milestone_alerts 
ADD CONSTRAINT fk_alert_milestone 
FOREIGN KEY (milestone_id) REFERENCES public.project_milestones(id) ON DELETE CASCADE;

ALTER TABLE public.milestone_templates 
ADD CONSTRAINT fk_template_company 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_project_milestones_project_id ON public.project_milestones(project_id);
CREATE INDEX idx_project_milestones_target_date ON public.project_milestones(target_date);
CREATE INDEX idx_project_milestones_status ON public.project_milestones(status);
CREATE INDEX idx_milestone_alerts_milestone_id ON public.milestone_alerts(milestone_id);
CREATE INDEX idx_milestone_alerts_triggered_at ON public.milestone_alerts(triggered_at);
CREATE INDEX idx_milestone_templates_company_id ON public.milestone_templates(company_id);

-- Create trigger for updated_at
CREATE TRIGGER update_project_milestones_updated_at
BEFORE UPDATE ON public.project_milestones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_milestone_templates_updated_at
BEFORE UPDATE ON public.milestone_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check milestone dependencies
CREATE OR REPLACE FUNCTION public.check_milestone_dependencies(milestone_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  dependency_id UUID;
  dependency_status TEXT;
BEGIN
  -- Check if all dependencies are completed
  FOR dependency_id IN 
    SELECT jsonb_array_elements_text(dependencies)::UUID 
    FROM public.project_milestones 
    WHERE id = milestone_id_param
  LOOP
    SELECT status INTO dependency_status 
    FROM public.project_milestones 
    WHERE id = dependency_id;
    
    IF dependency_status != 'completed' THEN
      RETURN false;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$;

-- Create function to calculate milestone health score
CREATE OR REPLACE FUNCTION public.calculate_milestone_health(milestone_id_param UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  milestone_record public.project_milestones%ROWTYPE;
  days_to_target INTEGER;
  health_score NUMERIC := 100;
  alert_count INTEGER;
BEGIN
  SELECT * INTO milestone_record 
  FROM public.project_milestones 
  WHERE id = milestone_id_param;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calculate days to target
  days_to_target := milestone_record.target_date - CURRENT_DATE;
  
  -- Adjust score based on time remaining
  IF days_to_target < 0 THEN
    health_score := 0; -- Overdue
  ELSIF days_to_target <= milestone_record.buffer_days THEN
    health_score := 25; -- Critical
  ELSIF days_to_target <= milestone_record.buffer_days * 2 THEN
    health_score := 50; -- At risk
  ELSIF days_to_target <= milestone_record.buffer_days * 3 THEN
    health_score := 75; -- Warning
  END IF;
  
  -- Adjust for dependencies
  IF NOT public.check_milestone_dependencies(milestone_id_param) THEN
    health_score := health_score * 0.7;
  END IF;
  
  -- Adjust for active alerts
  SELECT COUNT(*) INTO alert_count
  FROM public.milestone_alerts
  WHERE milestone_id = milestone_id_param
  AND resolved_at IS NULL;
  
  health_score := health_score - (alert_count * 10);
  
  RETURN GREATEST(0, LEAST(100, health_score));
END;
$$;