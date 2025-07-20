-- Fix RLS performance issues: optimize all remaining auth.uid() calls to prevent re-evaluation

-- Fix daily_reports policies
DROP POLICY IF EXISTS "Users can create daily reports for their company projects" ON public.daily_reports;
DROP POLICY IF EXISTS "Users can delete their own daily reports" ON public.daily_reports;
DROP POLICY IF EXISTS "Users can update their own daily reports" ON public.daily_reports;

CREATE POLICY "Users can create daily reports for their company projects"
ON public.daily_reports
FOR INSERT
WITH CHECK ((created_by = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = daily_reports.project_id) AND (p.company_id = get_my_company_id())))));

CREATE POLICY "Users can delete their own daily reports"
ON public.daily_reports
FOR DELETE
USING ((created_by = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = daily_reports.project_id) AND (p.company_id = get_my_company_id())))));

CREATE POLICY "Users can update their own daily reports"
ON public.daily_reports
FOR UPDATE
USING ((created_by = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = daily_reports.project_id) AND (p.company_id = get_my_company_id())))));

-- Fix profiles policies
DROP POLICY IF EXISTS "company_admins_can_update_company_profiles" ON public.profiles;
DROP POLICY IF EXISTS "company_admins_can_view_company_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.profiles;

CREATE POLICY "company_admins_can_update_company_profiles"
ON public.profiles
FOR UPDATE
USING (((select auth.uid()) = id) OR is_user_company_admin((select auth.uid()), company_id));

CREATE POLICY "company_admins_can_view_company_profiles"
ON public.profiles
FOR SELECT
USING (is_user_company_admin((select auth.uid()), company_id));

CREATE POLICY "users_can_insert_own_profile"
ON public.profiles
FOR INSERT
WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "users_can_update_own_profile"
ON public.profiles
FOR UPDATE
USING ((select auth.uid()) = id);

CREATE POLICY "users_can_view_own_profile"
ON public.profiles
FOR SELECT
USING ((select auth.uid()) = id);

-- Fix schedule_analytics policy
DROP POLICY IF EXISTS "Users can view their own analytics" ON public.schedule_analytics;

CREATE POLICY "Users can view their own analytics"
ON public.schedule_analytics
FOR ALL
USING ((user_id = (select auth.uid())) OR (current_user_is_admin() AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = schedule_analytics.user_id) AND (p.company_id = get_my_company_id()))))));

-- Fix team_schedule_templates policy
DROP POLICY IF EXISTS "Admins can manage templates" ON public.team_schedule_templates;

CREATE POLICY "Admins can manage templates"
ON public.team_schedule_templates
FOR ALL
USING ((company_id = get_my_company_id()) AND ((created_by = (select auth.uid())) OR current_user_is_admin()));