-- Update subscription limits function to include all limit types
CREATE OR REPLACE FUNCTION public.get_subscription_limits()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT 
    CASE 
      WHEN get_user_subscription_tier() = 'free' THEN
        '{
          "max_versions_per_file": 5, 
          "max_collaborators": 5, 
          "version_history_days": 90,
          "max_projects": 3,
          "max_users": 5,
          "max_storage_gb": 1,
          "max_files_per_project": 100,
          "max_tasks_per_project": 50
        }'::jsonb
      WHEN get_user_subscription_tier() = 'pro' THEN
        '{
          "max_versions_per_file": 50, 
          "max_collaborators": 10, 
          "version_history_days": 365,
          "max_projects": 25,
          "max_users": 25,
          "max_storage_gb": 10,
          "max_files_per_project": 1000,
          "max_tasks_per_project": 500
        }'::jsonb
      WHEN get_user_subscription_tier() = 'enterprise' THEN
        '{
          "max_versions_per_file": -1, 
          "max_collaborators": -1, 
          "version_history_days": -1,
          "max_projects": -1,
          "max_users": -1,
          "max_storage_gb": -1,
          "max_files_per_project": -1,
          "max_tasks_per_project": -1
        }'::jsonb
      ELSE
        '{
          "max_versions_per_file": 5, 
          "max_collaborators": 5, 
          "version_history_days": 90,
          "max_projects": 3,
          "max_users": 5,
          "max_storage_gb": 1,
          "max_files_per_project": 100,
          "max_tasks_per_project": 50
        }'::jsonb
    END;
$function$

-- Helper function to check if user can create new project
CREATE OR REPLACE FUNCTION public.can_create_project()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
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
  WHERE company_id = get_my_company_id();
  
  RETURN current_projects < max_projects;
END;
$function$

-- Helper function to check if company can add new user
CREATE OR REPLACE FUNCTION public.can_add_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
DECLARE
  current_users INTEGER;
  max_users INTEGER;
  limits JSONB;
BEGIN
  -- Get subscription limits
  limits := public.get_subscription_limits();
  max_users := (limits->>'max_users')::INTEGER;
  
  -- -1 means unlimited
  IF max_users = -1 THEN
    RETURN true;
  END IF;
  
  -- Count current users in company
  SELECT COUNT(*) INTO current_users
  FROM public.profiles
  WHERE company_id = get_my_company_id();
  
  RETURN current_users < max_users;
END;
$function$

-- Helper function to get current usage stats
CREATE OR REPLACE FUNCTION public.get_usage_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
DECLARE
  company_id_val BIGINT;
  project_count INTEGER;
  user_count INTEGER;
  total_storage_bytes BIGINT;
  result JSONB;
BEGIN
  company_id_val := get_my_company_id();
  
  -- Count projects
  SELECT COUNT(*) INTO project_count
  FROM public.projects
  WHERE company_id = company_id_val;
  
  -- Count users
  SELECT COUNT(*) INTO user_count
  FROM public.profiles
  WHERE company_id = company_id_val;
  
  -- Calculate total storage (sum of all project storage)
  SELECT COALESCE(SUM(total_size_bytes), 0) INTO total_storage_bytes
  FROM public.project_storage_stats pss
  JOIN public.projects p ON p.id = pss.project_id
  WHERE p.company_id = company_id_val;
  
  result := jsonb_build_object(
    'current_projects', project_count,
    'current_users', user_count,
    'current_storage_bytes', total_storage_bytes,
    'current_storage_gb', ROUND((total_storage_bytes::DECIMAL / 1073741824), 2)
  );
  
  RETURN result;
END;
$function$