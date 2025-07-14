-- Fix the SELECT policy to check project_members_enhanced instead of project_members
-- This matches where the trigger actually adds the project owner

-- Drop the old policy
DROP POLICY IF EXISTS "Users can view tasks in their projects" ON public.projects;

-- Create the corrected policy
CREATE POLICY "Users can view their company projects" 
ON public.projects 
FOR SELECT 
TO authenticated
USING (
  (get_my_company_id() = company_id) 
  AND (
    EXISTS (
      SELECT 1 FROM project_members_enhanced 
      WHERE project_members_enhanced.project_id = projects.id 
      AND project_members_enhanced.user_id = auth.uid()
    )
  )
);

-- Also fix the UPDATE policy to match
DROP POLICY IF EXISTS "users can access a project if their company ID matches the proj" ON public.projects;

CREATE POLICY "Users can update their company projects" 
ON public.projects 
FOR UPDATE 
TO authenticated
USING (
  (get_my_company_id() = company_id) 
  AND (
    EXISTS (
      SELECT 1 FROM project_members_enhanced 
      WHERE project_members_enhanced.project_id = projects.id 
      AND project_members_enhanced.user_id = auth.uid()
    )
  )
);

-- Also fix the DELETE policy to match
DROP POLICY IF EXISTS "users can delete data if their company ID matches the projects " ON public.projects;

CREATE POLICY "Users can delete their company projects" 
ON public.projects 
FOR DELETE 
TO authenticated
USING (
  (get_my_company_id() = company_id) 
  AND (
    EXISTS (
      SELECT 1 FROM project_members_enhanced 
      WHERE project_members_enhanced.project_id = projects.id 
      AND project_members_enhanced.user_id = auth.uid()
    )
  )
);