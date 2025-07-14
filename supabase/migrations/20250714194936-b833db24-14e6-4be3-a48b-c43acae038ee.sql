-- Fix security vulnerability: set immutable search_path for cleanup_expired_locks function

CREATE OR REPLACE FUNCTION public.cleanup_expired_locks()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  DELETE FROM public.file_locks 
  WHERE expires_at < now();
END;
$function$;