-- Fix security issues identified by the linter

-- Add missing RLS policies for milestone_alerts
CREATE POLICY "Users can create alerts for their company milestones" 
ON public.milestone_alerts 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.project_milestones pm
  JOIN public.projects p ON p.id = pm.project_id
  WHERE pm.id = milestone_alerts.milestone_id 
  AND p.company_id = get_my_company_id()
));

CREATE POLICY "Users can update alerts for their company milestones" 
ON public.milestone_alerts 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.project_milestones pm
  JOIN public.projects p ON p.id = pm.project_id
  WHERE pm.id = milestone_alerts.milestone_id 
  AND p.company_id = get_my_company_id()
));

-- Fix function search_path issues by adding security definer and set search_path
CREATE OR REPLACE FUNCTION public.check_milestone_dependencies(milestone_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.calculate_milestone_health(milestone_id_param UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  ELSIF days_to_target <= milestone_record.buffer_days * 3 THEN
    health_score := 50; -- At risk
  ELSIF days_to_target <= milestone_record.buffer_days * 2 THEN
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