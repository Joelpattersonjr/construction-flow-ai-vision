-- Fix security vulnerability: set immutable search_path for calculate_lockout_duration function

CREATE OR REPLACE FUNCTION public.calculate_lockout_duration(lockout_count integer)
 RETURNS interval
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  CASE lockout_count
    WHEN 1 THEN RETURN interval '30 seconds';
    WHEN 2 THEN RETURN interval '5 minutes';
    ELSE RETURN interval '10 minutes';
  END CASE;
END;
$function$;