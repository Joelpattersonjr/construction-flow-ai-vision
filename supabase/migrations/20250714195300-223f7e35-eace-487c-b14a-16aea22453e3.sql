-- Fix security vulnerability: set immutable search_path for update_collaborator_activity function

CREATE OR REPLACE FUNCTION public.update_collaborator_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.last_activity = now();
  RETURN NEW;
END;
$function$;