-- Fix final security vulnerabilities: set immutable search_path for subscription-related SECURITY DEFINER functions

CREATE OR REPLACE FUNCTION public.get_user_subscription_tier()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT COALESCE(
    (SELECT c.subscription_tier 
     FROM public.companies c
     JOIN public.profiles p ON p.company_id = c.id
     WHERE p.id = auth.uid()),
    'free'
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_subscription_feature(feature_name text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT COALESCE(
    (SELECT (c.subscription_features->feature_name)::boolean
     FROM public.companies c
     JOIN public.profiles p ON p.company_id = c.id
     WHERE p.id = auth.uid()),
    false
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_subscription_limits()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT 
    CASE 
      WHEN get_user_subscription_tier() = 'free' THEN
        '{"max_versions_per_file": 5, "max_collaborators": 5, "version_history_days": 90}'::jsonb
      WHEN get_user_subscription_tier() = 'pro' THEN
        '{"max_versions_per_file": 50, "max_collaborators": 10, "version_history_days": 365}'::jsonb
      WHEN get_user_subscription_tier() = 'enterprise' THEN
        '{"max_versions_per_file": -1, "max_collaborators": -1, "version_history_days": -1}'::jsonb
      ELSE
        '{"max_versions_per_file": 5, "max_collaborators": 5, "version_history_days": 90}'::jsonb
    END;
$function$;

CREATE OR REPLACE FUNCTION public.is_account_locked(user_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  lockout_record public.account_lockouts%ROWTYPE;
BEGIN
  SELECT * INTO lockout_record 
  FROM public.account_lockouts 
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if unlock time has passed
  IF lockout_record.unlock_at <= now() THEN
    -- Remove the lockout record as it has expired
    DELETE FROM public.account_lockouts WHERE email = user_email;
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$;