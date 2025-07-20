-- Fix Multiple Permissive Policies issues

-- Fix profiles table: Combine overlapping SELECT and UPDATE policies
DROP POLICY IF EXISTS "company_admins_can_view_company_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "company_admins_can_update_company_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;

-- Create single SELECT policy combining both use cases
CREATE POLICY "profiles_select_policy"
ON public.profiles
FOR SELECT
USING (
  (select auth.uid()) = id OR 
  is_user_company_admin((select auth.uid()), company_id)
);

-- Create single UPDATE policy combining both use cases  
CREATE POLICY "profiles_update_policy"
ON public.profiles
FOR UPDATE
USING (
  (select auth.uid()) = id OR 
  is_user_company_admin((select auth.uid()), company_id)
);

-- Fix team_schedule_templates table: Remove redundant SELECT policy since ALL covers it
DROP POLICY IF EXISTS "Company members can view templates" ON public.team_schedule_templates;

-- Fix weather_cache table: Remove redundant SELECT policy since ALL covers it
DROP POLICY IF EXISTS "Users can view weather cache for their company projects" ON public.weather_cache;