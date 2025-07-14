-- Fix security vulnerability: set immutable search_path for debug_policy_check function

CREATE OR REPLACE FUNCTION public.debug_policy_check(user_id uuid, project_company_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  current_uid uuid;
  user_company bigint;
  result boolean;
BEGIN
  current_uid := auth.uid();
  
  SELECT company_id INTO user_company 
  FROM public.profiles 
  WHERE id = current_uid;
  
  result := (current_uid = user_id AND project_company_id = user_company);
  
  -- Log for debugging
  RAISE NOTICE 'Policy Check - auth.uid(): %, user_id: %, user_company: %, project_company: %, result: %', 
    current_uid, user_id, user_company, project_company_id, result;
  
  RETURN result;
END;
$function$;