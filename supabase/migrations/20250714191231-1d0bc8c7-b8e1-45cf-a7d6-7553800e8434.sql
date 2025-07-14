-- Fix security issue: Set immutable search_path for get_company_name function
-- This prevents search path injection attacks
CREATE OR REPLACE FUNCTION public.get_company_name(company_id_param bigint)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT name FROM public.companies WHERE id = company_id_param;
$function$;