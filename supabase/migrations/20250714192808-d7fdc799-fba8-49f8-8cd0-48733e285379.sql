-- Fix security vulnerability: set immutable search_path for belongs_to_company function
-- This prevents search path manipulation attacks

CREATE OR REPLACE FUNCTION public.belongs_to_company(company_id_param bigint)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = company_id_param
  );
$function$;