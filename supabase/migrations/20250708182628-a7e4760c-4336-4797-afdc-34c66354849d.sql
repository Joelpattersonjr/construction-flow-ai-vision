-- Fix RLS policy for company creation to properly handle first-time users
-- The current policy is too restrictive and causing issues

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can create a company if they don't have one" ON public.companies;

-- Create a more permissive policy for company creation
-- Allow authenticated users to create a company if they are setting themselves as owner
-- and they don't already own a company
CREATE POLICY "Authenticated users can create a company" 
ON public.companies 
FOR INSERT 
WITH CHECK (
  auth.uid() = owner_id 
  AND NOT EXISTS (
    SELECT 1 FROM public.companies 
    WHERE owner_id = auth.uid()
  )
);

-- Also ensure the existing policies work correctly
-- Update the "Company admins can manage their company" policy to be more specific
DROP POLICY IF EXISTS "Company admins can manage their company" ON public.companies;
CREATE POLICY "Company admins can manage their company" 
ON public.companies 
FOR ALL 
USING (
  auth.uid() = owner_id 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = companies.id 
    AND profiles.company_role = 'company_admin'
  )
);