-- Fix security issue: Set immutable search_path for is_company_owner function
-- This prevents search path injection attacks
CREATE OR REPLACE FUNCTION public.is_company_owner(owner_id_param uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT auth.uid() = owner_id_param;
$function$;