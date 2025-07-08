-- Create user invitations table for invite-only signup
CREATE TABLE public.user_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_role TEXT CHECK (company_role IN ('company_admin', 'company_member')) DEFAULT 'company_member',
  project_roles JSONB DEFAULT '[]'::jsonb, -- Array of {project_id, role}
  invitation_token UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate invitations
CREATE UNIQUE INDEX idx_user_invitations_email_company 
ON public.user_invitations(email, company_id) 
WHERE accepted_at IS NULL;

-- Add company_role to profiles table
ALTER TABLE public.profiles 
ADD COLUMN company_role TEXT CHECK (company_role IN ('company_admin', 'company_member')) DEFAULT 'company_member';

-- Update existing company owners to be company_admin
UPDATE public.profiles 
SET company_role = 'company_admin' 
WHERE id IN (
  SELECT owner_id 
  FROM public.companies 
  WHERE owner_id IS NOT NULL
);

-- Enable RLS on user_invitations
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_invitations
CREATE POLICY "Company admins can manage invitations" 
ON public.user_invitations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = user_invitations.company_id 
    AND profiles.company_role = 'company_admin'
  )
);

CREATE POLICY "Users can view their own invitations" 
ON public.user_invitations 
FOR SELECT 
USING (
  auth.jwt() ->> 'email' = email 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = user_invitations.company_id 
    AND profiles.company_role = 'company_admin'
  )
);

-- Update profiles RLS to include company role checks
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile via invitation" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() = id 
  AND (
    -- Allow if there's a valid invitation
    EXISTS (
      SELECT 1 FROM public.user_invitations 
      WHERE email = auth.jwt() ->> 'email' 
      AND accepted_at IS NULL 
      AND expires_at > now()
    )
    -- Or if they're already a company admin (for initial setup)
    OR company_role = 'company_admin'
  )
);

-- Function to accept invitation and create profile
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record public.user_invitations%ROWTYPE;
  user_email TEXT;
  new_profile_id UUID;
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
    updated_at
  ) VALUES (
    auth.uid(),
    invitation_record.company_id,
    invitation_record.company_role,
    COALESCE(auth.jwt() ->> 'full_name', split_part(user_email, '@', 1)),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    company_id = invitation_record.company_id,
    company_role = invitation_record.company_role,
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
$$;

-- Create trigger to update updated_at on user_invitations
CREATE TRIGGER update_user_invitations_updated_at
BEFORE UPDATE ON public.user_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();