-- Fix all remaining Auth RLS Initialization Plan performance issues
-- Optimize auth.uid() calls in RLS policies to prevent re-evaluation for each row

-- Fix project_members_enhanced policies
DROP POLICY IF EXISTS "Project owners can manage project members" ON public.project_members_enhanced;
DROP POLICY IF EXISTS "Users can view project members for their company" ON public.project_members_enhanced;

CREATE POLICY "Project owners can manage project members" 
ON public.project_members_enhanced 
FOR ALL 
USING ((select auth.uid()) = ( SELECT projects.owner_id FROM projects WHERE (projects.id = project_members_enhanced.project_id)));

CREATE POLICY "Users can view project members for their company" 
ON public.project_members_enhanced 
FOR SELECT 
USING (EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (select auth.uid())) AND (p.company_id = ( SELECT projects.company_id FROM projects WHERE (projects.id = project_members_enhanced.project_id))))));

-- Fix task_comments policies
DROP POLICY IF EXISTS "Users can create comments on their company tasks" ON public.task_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.task_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.task_comments;

CREATE POLICY "Users can create comments on their company tasks" 
ON public.task_comments 
FOR INSERT 
WITH CHECK ((user_id = (select auth.uid())) AND (EXISTS ( SELECT 1 FROM (tasks t JOIN projects p ON ((t.project_id = p.id))) WHERE ((t.id = task_comments.task_id) AND (p.company_id = get_my_company_id())))));

CREATE POLICY "Users can delete their own comments" 
ON public.task_comments 
FOR DELETE 
USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own comments" 
ON public.task_comments 
FOR UPDATE 
USING (user_id = (select auth.uid()));

-- Fix task_time_entries policies
DROP POLICY IF EXISTS "Users can create their own time entries" ON public.task_time_entries;
DROP POLICY IF EXISTS "Users can delete their own time entries" ON public.task_time_entries;
DROP POLICY IF EXISTS "Users can update their own time entries" ON public.task_time_entries;

CREATE POLICY "Users can create their own time entries" 
ON public.task_time_entries 
FOR INSERT 
WITH CHECK ((user_id = (select auth.uid())) AND (EXISTS ( SELECT 1 FROM (tasks t JOIN projects p ON ((t.project_id = p.id))) WHERE ((t.id = task_time_entries.task_id) AND (p.company_id = get_my_company_id())))));

CREATE POLICY "Users can delete their own time entries" 
ON public.task_time_entries 
FOR DELETE 
USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own time entries" 
ON public.task_time_entries 
FOR UPDATE 
USING (user_id = (select auth.uid())) 
WITH CHECK (user_id = (select auth.uid()));

-- Fix task_files policies
DROP POLICY IF EXISTS "Users can delete files they uploaded" ON public.task_files;
DROP POLICY IF EXISTS "Users can upload files to their company tasks" ON public.task_files;

CREATE POLICY "Users can delete files they uploaded" 
ON public.task_files 
FOR DELETE 
USING (uploaded_by = (select auth.uid()));

CREATE POLICY "Users can upload files to their company tasks" 
ON public.task_files 
FOR INSERT 
WITH CHECK ((uploaded_by = (select auth.uid())) AND (EXISTS ( SELECT 1 FROM (tasks t JOIN projects p ON ((t.project_id = p.id))) WHERE ((t.id = task_files.task_id) AND (p.company_id = get_my_company_id())))));

-- Fix task_templates policies
DROP POLICY IF EXISTS "Users can create templates for their company" ON public.task_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.task_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.task_templates;

CREATE POLICY "Users can create templates for their company" 
ON public.task_templates 
FOR INSERT 
WITH CHECK ((company_id = get_my_company_id()) AND (created_by = (select auth.uid())));

CREATE POLICY "Users can delete their own templates" 
ON public.task_templates 
FOR DELETE 
USING ((company_id = get_my_company_id()) AND (created_by = (select auth.uid())));

CREATE POLICY "Users can update their own templates" 
ON public.task_templates 
FOR UPDATE 
USING ((company_id = get_my_company_id()) AND (created_by = (select auth.uid())));

-- Fix permission_templates policies
DROP POLICY IF EXISTS "Users can create templates for their company" ON public.permission_templates;

CREATE POLICY "Users can create templates for their company" 
ON public.permission_templates 
FOR INSERT 
WITH CHECK ((company_id = get_my_company_id()) AND (created_by = (select auth.uid())));

-- Fix profiles policies
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile via invitation" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert their own profile via invitation" 
ON public.profiles 
FOR INSERT 
WITH CHECK (((select auth.uid()) = id) AND ((EXISTS ( SELECT 1 FROM user_invitations WHERE ((user_invitations.email = (auth.jwt() ->> 'email'::text)) AND (user_invitations.accepted_at IS NULL) AND (user_invitations.expires_at > now())))) OR (NOT (EXISTS ( SELECT 1 FROM profiles profiles_1 WHERE (profiles_1.company_role = 'company_admin'::text)))) OR (company_role = 'company_admin'::text)));

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING ((select auth.uid()) = id);

-- Fix company_custom_fields policies
DROP POLICY IF EXISTS "Company admins can manage custom fields" ON public.company_custom_fields;
DROP POLICY IF EXISTS "Company members can view custom fields" ON public.company_custom_fields;

CREATE POLICY "Company admins can manage custom fields" 
ON public.company_custom_fields 
FOR ALL 
USING (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.company_id = company_custom_fields.company_id) AND (profiles.company_role = 'company_admin'::text))));

CREATE POLICY "Company members can view custom fields" 
ON public.company_custom_fields 
FOR SELECT 
USING (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.company_id = company_custom_fields.company_id))));

-- Fix user_invitations policies
DROP POLICY IF EXISTS "Company admins can manage invitations" ON public.user_invitations;

CREATE POLICY "Company admins can manage invitations" 
ON public.user_invitations 
FOR ALL 
USING (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.company_id = user_invitations.company_id) AND (profiles.company_role = 'company_admin'::text))));

-- Fix profiles company admin policies
DROP POLICY IF EXISTS "Company admins can update company profiles" ON public.profiles;

CREATE POLICY "Company admins can update company profiles" 
ON public.profiles 
FOR UPDATE 
USING (EXISTS ( SELECT 1 FROM profiles current_user_profile WHERE ((current_user_profile.id = (select auth.uid())) AND (current_user_profile.company_id = profiles.company_id) AND (current_user_profile.company_role = 'company_admin'::text))));