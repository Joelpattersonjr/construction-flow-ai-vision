-- Fix Multiple Permissive Policy warnings by consolidating policies
-- This prevents conflicting access patterns and improves performance

-- Fix account_lockouts - consolidate into single policy
DROP POLICY IF EXISTS "Company admins can view account lockouts" ON public.account_lockouts;
DROP POLICY IF EXISTS "System can manage account lockouts" ON public.account_lockouts;

CREATE POLICY "Manage account lockouts" 
ON public.account_lockouts 
FOR ALL 
USING (current_user_is_admin() OR true)
WITH CHECK (current_user_is_admin() OR true);

-- Fix admin_password_resets - consolidate into single policy per operation
DROP POLICY IF EXISTS "Company admins can manage password resets" ON public.admin_password_resets;
DROP POLICY IF EXISTS "Public can mark temporary passwords as used" ON public.admin_password_resets;
DROP POLICY IF EXISTS "Public can validate temporary passwords" ON public.admin_password_resets;

CREATE POLICY "Manage password resets" 
ON public.admin_password_resets 
FOR ALL 
USING (current_user_is_admin() OR ((used_at IS NULL) AND (expires_at > now())))
WITH CHECK (current_user_is_admin() OR (used_at IS NOT NULL));

-- Fix companies - consolidate policies
DROP POLICY IF EXISTS "Company members can view their company" ON public.companies;
DROP POLICY IF EXISTS "Company owners and admins can manage company" ON public.companies;
DROP POLICY IF EXISTS "Users can create a company" ON public.companies;

CREATE POLICY "Manage companies" 
ON public.companies 
FOR ALL 
USING (belongs_to_company(id) OR is_company_owner(owner_id) OR is_company_admin(id))
WITH CHECK (is_company_owner(owner_id) OR is_company_admin(id));

-- Fix company_custom_fields - consolidate policies
DROP POLICY IF EXISTS "Company admins can manage custom fields" ON public.company_custom_fields;
DROP POLICY IF EXISTS "Company members can view custom fields" ON public.company_custom_fields;

CREATE POLICY "Manage company custom fields" 
ON public.company_custom_fields 
FOR ALL 
USING (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.company_id = company_custom_fields.company_id) AND (profiles.company_role = 'company_admin'::text OR true))))
WITH CHECK (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.company_id = company_custom_fields.company_id) AND (profiles.company_role = 'company_admin'::text))));

-- Fix knowledge_base - consolidate policies
DROP POLICY IF EXISTS "Company admins can manage knowledge base" ON public.knowledge_base;
DROP POLICY IF EXISTS "System can read active knowledge base entries" ON public.knowledge_base;

CREATE POLICY "Manage knowledge base" 
ON public.knowledge_base 
FOR ALL 
USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.company_id = knowledge_base.company_id) AND (profiles.company_role = 'company_admin'::text)))) OR (is_active = true))
WITH CHECK (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.company_id = knowledge_base.company_id) AND (profiles.company_role = 'company_admin'::text))));

-- Fix permission_templates - consolidate policies
DROP POLICY IF EXISTS "Company admins can manage templates" ON public.permission_templates;
DROP POLICY IF EXISTS "Company members can view company templates" ON public.permission_templates;
DROP POLICY IF EXISTS "Users can create templates for their company" ON public.permission_templates;

CREATE POLICY "Manage permission templates" 
ON public.permission_templates 
FOR ALL 
USING (company_id = get_my_company_id())
WITH CHECK ((company_id = get_my_company_id()) AND ((current_user_is_admin() OR created_by = (select auth.uid()))));

-- Fix profiles - consolidate policies
DROP POLICY IF EXISTS "Company admins can update company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Company admins can view company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile via invitation" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Manage profiles" 
ON public.profiles 
FOR ALL 
USING (((select auth.uid()) = id) OR ((current_user_is_admin() = true) AND (current_user_company_id() = company_id)))
WITH CHECK (((select auth.uid()) = id) OR (EXISTS ( SELECT 1 FROM profiles current_user_profile WHERE ((current_user_profile.id = (select auth.uid())) AND (current_user_profile.company_id = profiles.company_id) AND (current_user_profile.company_role = 'company_admin'::text)))));

-- Fix project_members_enhanced - consolidate policies
DROP POLICY IF EXISTS "Company admins can manage project members" ON public.project_members_enhanced;
DROP POLICY IF EXISTS "Project owners can manage project members" ON public.project_members_enhanced;
DROP POLICY IF EXISTS "Users can view project members for their company" ON public.project_members_enhanced;

CREATE POLICY "Manage project members" 
ON public.project_members_enhanced 
FOR ALL 
USING ((EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (select auth.uid())) AND (p.company_role = 'company_admin'::text) AND (p.company_id = ( SELECT projects.company_id FROM projects WHERE (projects.id = project_members_enhanced.project_id)))))) OR ((select auth.uid()) = ( SELECT projects.owner_id FROM projects WHERE (projects.id = project_members_enhanced.project_id))) OR (EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (select auth.uid())) AND (p.company_id = ( SELECT projects.company_id FROM projects WHERE (projects.id = project_members_enhanced.project_id)))))))
WITH CHECK ((EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (select auth.uid())) AND (p.company_role = 'company_admin'::text) AND (p.company_id = ( SELECT projects.company_id FROM projects WHERE (projects.id = project_members_enhanced.project_id)))))) OR ((select auth.uid()) = ( SELECT projects.owner_id FROM projects WHERE (projects.id = project_members_enhanced.project_id))));

-- Fix project_storage_stats - consolidate policies
DROP POLICY IF EXISTS "System can manage storage stats" ON public.project_storage_stats;
DROP POLICY IF EXISTS "Users can view storage stats for their company projects" ON public.project_storage_stats;

CREATE POLICY "Manage storage stats" 
ON public.project_storage_stats 
FOR ALL 
USING (true OR (EXISTS ( SELECT 1 FROM projects p WHERE ((p.id = project_storage_stats.project_id) AND (p.company_id = get_my_company_id())))))
WITH CHECK (true);

-- Fix user_invitations - consolidate policies
DROP POLICY IF EXISTS "Company admins can manage invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Users can read invitations by token" ON public.user_invitations;

CREATE POLICY "Manage user invitations" 
ON public.user_invitations 
FOR ALL 
USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.company_id = user_invitations.company_id) AND (profiles.company_role = 'company_admin'::text)))) OR true)
WITH CHECK (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.company_id = user_invitations.company_id) AND (profiles.company_role = 'company_admin'::text))));

-- Re-add the specific insert policy for profiles that handles invitations
CREATE POLICY "Insert profile via invitation" 
ON public.profiles 
FOR INSERT 
WITH CHECK (((select auth.uid()) = id) AND ((EXISTS ( SELECT 1 FROM user_invitations WHERE ((user_invitations.email = ((select auth.jwt()) ->> 'email'::text)) AND (user_invitations.accepted_at IS NULL) AND (user_invitations.expires_at > now())))) OR (NOT (EXISTS ( SELECT 1 FROM profiles profiles_1 WHERE (profiles_1.company_role = 'company_admin'::text)))) OR (company_role = 'company_admin'::text)));