-- Fix security vulnerability: set immutable search_path for get_user_company_from_jwt function

CREATE OR REPLACE FUNCTION public.get_user_company_from_jwt()
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT COALESCE(
    (SELECT company_id FROM public.profiles WHERE id = (auth.jwt() ->> 'sub')::uuid),
    NULL
  );
$function$;