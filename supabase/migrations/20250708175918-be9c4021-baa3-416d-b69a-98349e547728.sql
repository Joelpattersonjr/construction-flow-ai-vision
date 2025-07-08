-- Remove redundant company_name from profiles table and improve data consistency
-- This migration will:
-- 1. Remove the company_name column from profiles (redundant with companies table)
-- 2. Update the handle_new_user function to not set company_name
-- 3. Add proper foreign key constraints
-- 4. Update RLS policies to work with the new structure

-- First, let's update the handle_new_user function to not reference company_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- For new users, we'll create a basic profile
  -- Company assignment will happen through invitations or a separate onboarding flow
  INSERT INTO public.profiles (id, full_name, updated_at)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    now()
  );
  RETURN new;
END;
$$;

-- Add proper foreign key constraint for company_id in profiles
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

-- Remove the redundant company_name column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS company_name;

-- Update RLS policies to work better with the new structure
-- First, create a helper function to get company name from companies table
CREATE OR REPLACE FUNCTION public.get_company_name(company_id_param BIGINT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT name FROM public.companies WHERE id = company_id_param;
$$;

-- Update the profiles RLS policy for insertion to be more permissive for first-time users
DROP POLICY IF EXISTS "Users can insert their own profile via invitation" ON public.profiles;
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
    -- Or if they're the first user (no existing company admins)
    OR NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE company_role = 'company_admin'
    )
    -- Or if they already have a company admin role (for updates)
    OR company_role = 'company_admin'
  )
);

-- Add RLS policy for companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Company admins can view and manage their own company
CREATE POLICY "Company admins can manage their company" 
ON public.companies 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = companies.id 
    AND profiles.company_role = 'company_admin'
  )
);

-- Users can view their company details
CREATE POLICY "Users can view their company" 
ON public.companies 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = companies.id
  )
);

-- Allow company creation for authenticated users without a company
CREATE POLICY "Users can create a company if they don't have one" 
ON public.companies 
FOR INSERT 
WITH CHECK (
  auth.uid() = owner_id 
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id IS NOT NULL
  )
);

-- Create updated_at trigger for companies table
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add created_at and updated_at columns to companies if they don't exist
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();