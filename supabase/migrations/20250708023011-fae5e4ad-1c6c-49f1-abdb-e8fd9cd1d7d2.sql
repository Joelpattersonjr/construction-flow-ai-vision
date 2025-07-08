-- Create the update timestamp function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Create trigger to update updated_at on user_invitations
CREATE TRIGGER update_user_invitations_updated_at
BEFORE UPDATE ON public.user_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();