-- Fix remaining complex RLS policies with auth function calls

-- Fix company_custom_fields policies
DROP POLICY IF EXISTS "Manage company custom fields" ON public.company_custom_fields;

CREATE POLICY "Manage company custom fields"
ON public.company_custom_fields
FOR ALL
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.company_id = company_custom_fields.company_id) AND ((profiles.company_role = 'company_admin'::text) OR true))))
WITH CHECK (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.company_id = company_custom_fields.company_id) AND (profiles.company_role = 'company_admin'::text))));

-- Fix file_versions policy
DROP POLICY IF EXISTS "Users can create versions for their company projects" ON public.file_versions;

CREATE POLICY "Users can create versions for their company projects"
ON public.file_versions
FOR INSERT
WITH CHECK ((EXISTS ( SELECT 1
   FROM (documents d
     JOIN projects p ON ((d.project_id = p.id)))
  WHERE ((d.id = file_versions.document_id) AND (p.company_id = get_my_company_id())))) AND (created_by = (select auth.uid())));

-- Fix knowledge_base policies
DROP POLICY IF EXISTS "Manage knowledge base" ON public.knowledge_base;

CREATE POLICY "Manage knowledge base"
ON public.knowledge_base
FOR ALL
USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.company_id = knowledge_base.company_id) AND (profiles.company_role = 'company_admin'::text)))) OR (is_active = true))
WITH CHECK (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.company_id = knowledge_base.company_id) AND (profiles.company_role = 'company_admin'::text))));

-- Fix permission_templates policy
DROP POLICY IF EXISTS "Manage permission templates" ON public.permission_templates;

CREATE POLICY "Manage permission templates"
ON public.permission_templates
FOR ALL
USING (company_id = get_my_company_id())
WITH CHECK ((company_id = get_my_company_id()) AND (current_user_is_admin() OR (created_by = (select auth.uid()))));

-- Fix project_members_enhanced policy
DROP POLICY IF EXISTS "Manage project members" ON public.project_members_enhanced;

CREATE POLICY "Manage project members"
ON public.project_members_enhanced
FOR ALL
USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND (p.company_role = 'company_admin'::text) AND (p.company_id = ( SELECT projects.company_id
           FROM projects
          WHERE (projects.id = project_members_enhanced.project_id)))))) OR ((select auth.uid()) = ( SELECT projects.owner_id
   FROM projects
  WHERE (projects.id = project_members_enhanced.project_id))) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND (p.company_id = ( SELECT projects.company_id
           FROM projects
          WHERE (projects.id = project_members_enhanced.project_id)))))))
WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND (p.company_role = 'company_admin'::text) AND (p.company_id = ( SELECT projects.company_id
           FROM projects
          WHERE (projects.id = project_members_enhanced.project_id)))))) OR ((select auth.uid()) = ( SELECT projects.owner_id
   FROM projects
  WHERE (projects.id = project_members_enhanced.project_id))));

-- Fix user_invitations policy
DROP POLICY IF EXISTS "Manage user invitations" ON public.user_invitations;

CREATE POLICY "Manage user invitations"
ON public.user_invitations
FOR ALL
USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.company_id = user_invitations.company_id) AND (profiles.company_role = 'company_admin'::text)))) OR true)
WITH CHECK (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.company_id = user_invitations.company_id) AND (profiles.company_role = 'company_admin'::text))));