-- Fix security issue: Set immutable search_path for is_company_admin function
-- This prevents search path injection attacks
CREATE OR REPLACE FUNCTION public.is_company_admin(company_id_param bigint)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = company_id_param 
    AND profiles.company_role = 'company_admin'
  );
$function$;