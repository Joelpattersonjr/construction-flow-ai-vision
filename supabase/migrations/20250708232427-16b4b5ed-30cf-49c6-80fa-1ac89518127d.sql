-- Update accept_invitation function to handle job_title from JWT metadata
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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