-- Fix get_subscription_limits function to use immutable search_path

CREATE OR REPLACE FUNCTION public.get_subscription_limits()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT 
    CASE 
      WHEN public.get_user_subscription_tier() = 'free' THEN
        '{"max_versions_per_file": 5, "max_collaborators": 5, "version_history_days": 90}'::jsonb
      WHEN public.get_user_subscription_tier() = 'pro' THEN
        '{"max_versions_per_file": 50, "max_collaborators": 10, "version_history_days": 365}'::jsonb
      WHEN public.get_user_subscription_tier() = 'enterprise' THEN
        '{"max_versions_per_file": -1, "max_collaborators": -1, "version_history_days": -1}'::jsonb
      ELSE
        '{"max_versions_per_file": 5, "max_collaborators": 5, "version_history_days": 90}'::jsonb
    END;
$function$;