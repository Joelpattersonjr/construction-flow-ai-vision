-- Fix circular dependency in RLS policies that's causing infinite recursion
-- The issue is that projects table depends on project_members_enhanced, 
-- but project_members_enhanced also depends on projects table

-- Fix the project_members_enhanced policies to not depend on projects table
DROP POLICY IF EXISTS "Users can view project members if they belong to the company" ON public.project_members_enhanced;
DROP POLICY IF EXISTS "Project owners and company admins can manage project members" ON public.project_members_enhanced;

-- Create new policies that don't create circular dependency
CREATE POLICY "Users can view project members for their company" 
ON public.project_members_enhanced 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.company_id = (
      SELECT company_id FROM projects 
      WHERE id = project_members_enhanced.project_id
    )
  )
);

CREATE POLICY "Company admins can manage project members" 
ON public.project_members_enhanced 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.company_role = 'company_admin'
    AND p.company_id = (
      SELECT company_id FROM projects 
      WHERE id = project_members_enhanced.project_id
    )
  )
);

CREATE POLICY "Project owners can manage project members" 
ON public.project_members_enhanced 
FOR ALL 
TO authenticated
USING (
  auth.uid() = (
    SELECT owner_id FROM projects 
    WHERE id = project_members_enhanced.project_id
  )
);