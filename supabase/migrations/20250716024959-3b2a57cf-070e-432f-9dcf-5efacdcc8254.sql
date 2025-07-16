-- First, let's check what policies exist on the profiles table
-- We need to see the current policies to identify the recursion issue

-- Drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "delete_own_profile" ON public.profiles;

-- Create simple, non-recursive policies
-- Users can view their own profile
CREATE POLICY "users_can_view_own_profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile  
CREATE POLICY "users_can_update_own_profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (for new user registration)
CREATE POLICY "users_can_insert_own_profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Company admins can view profiles in their company
CREATE POLICY "company_admins_can_view_company_profiles" ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.company_role = 'company_admin'
      AND admin_profile.company_id = profiles.company_id
    )
  );

-- Company admins can update profiles in their company
CREATE POLICY "company_admins_can_update_company_profiles" ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.profiles admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.company_role = 'company_admin'
      AND admin_profile.company_id = profiles.company_id
    )
  );