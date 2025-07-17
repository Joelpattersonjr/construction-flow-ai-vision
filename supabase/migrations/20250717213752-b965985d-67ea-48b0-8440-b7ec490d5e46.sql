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