-- Fix security vulnerability: set immutable search_path for get_my_company_id function

CREATE OR REPLACE FUNCTION public.get_my_company_id()
 RETURNS bigint
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
SELECT company_id
FROM public.profiles
WHERE id = auth.uid();
$function$;