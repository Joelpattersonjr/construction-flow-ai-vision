-- Fix search path security issue for get_usage_stats function
CREATE OR REPLACE FUNCTION public.get_usage_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  company_id_val BIGINT;
  project_count INTEGER;
  user_count INTEGER;
  total_storage_bytes BIGINT;
  result JSONB;
BEGIN
  company_id_val := public.get_my_company_id();
  
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
$$;