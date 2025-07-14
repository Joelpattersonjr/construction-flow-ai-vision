-- Fix security vulnerabilities: set immutable search_path for all SECURITY DEFINER functions
-- This prevents search path manipulation attacks

CREATE OR REPLACE FUNCTION public.current_user_company_id()
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT COALESCE(
    (SELECT company_id FROM public.profiles WHERE id = auth.uid()),
    NULL
  );
$function$;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT COALESCE(
    (SELECT company_role = 'company_admin' FROM public.profiles WHERE id = auth.uid()),
    false
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_trial_status(company_id_param bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  company_record public.companies%ROWTYPE;
  days_remaining integer;
  result jsonb;
BEGIN
  SELECT * INTO company_record 
  FROM public.companies 
  WHERE id = company_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Company not found');
  END IF;
  
  -- Calculate days remaining in trial
  days_remaining := EXTRACT(days FROM (company_record.trial_ends_at - now()))::integer;
  
  result := jsonb_build_object(
    'is_trial_active', (now() < company_record.trial_ends_at AND company_record.subscription_tier IN ('trial', 'free')),
    'trial_started_at', company_record.trial_started_at,
    'trial_ends_at', company_record.trial_ends_at,
    'days_remaining', GREATEST(0, days_remaining),
    'trial_expired', now() >= company_record.trial_ends_at
  );
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  invitation_record public.user_invitations%ROWTYPE;
  user_email TEXT;
BEGIN
  -- Get current user email
  user_email := auth.jwt() ->> 'email';
  
  -- Get invitation details
  SELECT * INTO invitation_record 
  FROM public.user_invitations 
  WHERE user_invitations.invitation_token = accept_invitation.invitation_token
  AND email = user_email
  AND accepted_at IS NULL
  AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Invalid or expired invitation');
  END IF;
  
  -- Create or update profile
  INSERT INTO public.profiles (
    id, 
    company_id, 
    company_role,
    full_name,
    job_title,
    updated_at
  ) VALUES (
    auth.uid(),
    invitation_record.company_id,
    invitation_record.company_role,
    COALESCE(auth.jwt() ->> 'full_name', split_part(user_email, '@', 1)),
    auth.jwt() ->> 'job_title',
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    company_id = invitation_record.company_id,
    company_role = invitation_record.company_role,
    full_name = COALESCE(auth.jwt() ->> 'full_name', EXCLUDED.full_name),
    job_title = COALESCE(auth.jwt() ->> 'job_title', EXCLUDED.job_title),
    updated_at = now();
  
  -- Add project memberships from invitation
  INSERT INTO public.project_members (project_id, user_id, role)
  SELECT 
    (project_role->>'project_id')::UUID,
    auth.uid(),
    project_role->>'role'
  FROM jsonb_array_elements(invitation_record.project_roles) AS project_role
  ON CONFLICT (project_id, user_id) DO UPDATE SET
    role = EXCLUDED.role;
  
  -- Mark invitation as accepted
  UPDATE public.user_invitations 
  SET 
    accepted_at = now(),
    updated_at = now()
  WHERE user_invitations.invitation_token = accept_invitation.invitation_token;
  
  RETURN jsonb_build_object(
    'success', true,
    'company_id', invitation_record.company_id,
    'company_role', invitation_record.company_role
  );
END;
$function$;