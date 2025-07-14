-- Fix RLS performance issue: optimize auth.uid() call in project_members_enhanced policy
DROP POLICY IF EXISTS "Company admins can manage project members" ON public.project_members_enhanced;

CREATE POLICY "Company admins can manage project members" 
ON public.project_members_enhanced 
FOR ALL 
USING (EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (select auth.uid())) AND (p.company_role = 'company_admin'::text) AND (p.company_id = ( SELECT projects.company_id FROM projects WHERE (projects.id = project_members_enhanced.project_id))))));