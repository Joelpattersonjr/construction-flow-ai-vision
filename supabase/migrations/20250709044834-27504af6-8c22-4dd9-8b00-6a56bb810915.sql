-- Fix the RLS policy for project creation
-- Drop the existing problematic INSERT policy
DROP POLICY IF EXISTS "a user can inser company data if their company ID matches the p" ON public.projects;

-- Create a new INSERT policy that allows users to create projects for their own company
CREATE POLICY "Users can create projects for their company" 
ON public.projects 
FOR INSERT 
WITH CHECK (
  auth.uid() = owner_id 
  AND get_my_company_id() = company_id
);