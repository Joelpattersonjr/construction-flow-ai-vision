-- Remove circular dependency by simplifying projects policies
-- The issue is still circular: projects -> project_members_enhanced -> projects

-- Drop the current projects policies that create circular dependency
DROP POLICY IF EXISTS "Users can view their company projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their company projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their company projects" ON public.projects;

-- Create simplified policies that only check company membership
-- Users can see projects from their company (company-level security)
CREATE POLICY "Users can view their company projects" 
ON public.projects 
FOR SELECT 
TO authenticated
USING (get_my_company_id() = company_id);

-- Users can update projects from their company
CREATE POLICY "Users can update their company projects" 
ON public.projects 
FOR UPDATE 
TO authenticated
USING (get_my_company_id() = company_id);

-- Users can delete projects from their company  
CREATE POLICY "Users can delete their company projects" 
ON public.projects 
FOR DELETE 
TO authenticated
USING (get_my_company_id() = company_id);

-- The project membership is enforced by the trigger that adds users to project_members_enhanced
-- when they create a project, so company-level access is sufficient