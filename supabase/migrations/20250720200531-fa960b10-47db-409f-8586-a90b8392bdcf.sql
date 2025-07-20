-- Fix search path security issue for can_create_project function
CREATE OR REPLACE FUNCTION public.can_create_project()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_projects INTEGER;
  max_projects INTEGER;
  limits JSONB;
BEGIN
  -- Get subscription limits
  limits := public.get_subscription_limits();
  max_projects := (limits->>'max_projects')::INTEGER;
  
  -- -1 means unlimited
  IF max_projects = -1 THEN
    RETURN true;
  END IF;
  
  -- Count current projects for user's company
  SELECT COUNT(*) INTO current_projects
  FROM public.projects
  WHERE company_id = public.get_my_company_id();
  
  RETURN current_projects < max_projects;
END;
$$;