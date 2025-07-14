-- Fix security vulnerability: set immutable search_path for set_trial_period function

CREATE OR REPLACE FUNCTION public.set_trial_period()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  -- Set 30-day trial for new companies
  NEW.trial_started_at = now();
  NEW.trial_ends_at = now() + interval '30 days';
  NEW.subscription_tier = 'trial';
  NEW.subscription_status = 'trial';
  NEW.subscription_features = jsonb_build_object(
    'version_control', true,
    'collaboration', true, 
    'advanced_analytics', false,
    'time_tracking', false
  );
  RETURN NEW;
END;
$function$;