-- Fix search path security issue for can_add_user function
CREATE OR REPLACE FUNCTION public.can_add_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_users INTEGER;
  max_users INTEGER;
  limits JSONB;
BEGIN
  -- Get subscription limits
  limits := public.get_subscription_limits();
  max_users := (limits->>'max_users')::INTEGER;
  
  -- -1 means unlimited
  IF max_users = -1 THEN
    RETURN true;
  END IF;
  
  -- Count current users in company
  SELECT COUNT(*) INTO current_users
  FROM public.profiles
  WHERE company_id = public.get_my_company_id();
  
  RETURN current_users < max_users;
END;
$$;