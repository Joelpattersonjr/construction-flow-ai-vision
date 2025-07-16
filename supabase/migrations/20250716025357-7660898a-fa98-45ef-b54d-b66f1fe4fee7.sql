-- Check current policies on profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Drop ALL existing policies on profiles table to ensure clean slate
DROP POLICY IF EXISTS "Delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Update profiles" ON public.profiles;
DROP POLICY IF EXISTS "View profiles" ON public.profiles;
DROP POLICY IF EXISTS "company_admins_can_update_company_profiles" ON public.profiles;
DROP POLICY IF EXISTS "company_admins_can_view_company_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.profiles;

-- Create security definer function to check if user is company admin
-- This prevents recursion by using SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.is_user_company_admin(user_id uuid, company_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND profiles.company_id = is_user_company_admin.company_id 
    AND company_role = 'company_admin'
  );
$$;

-- Create simple, non-recursive policies using the security definer function
-- Users can view their own profile
CREATE POLICY "users_can_view_own_profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile  
CREATE POLICY "users_can_update_own_profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "users_can_insert_own_profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Company admins can view profiles in their company (using security definer function)
CREATE POLICY "company_admins_can_view_company_profiles" ON public.profiles
  FOR SELECT
  USING (public.is_user_company_admin(auth.uid(), profiles.company_id));

-- Company admins can update profiles in their company (using security definer function)
CREATE POLICY "company_admins_can_update_company_profiles" ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id OR 
    public.is_user_company_admin(auth.uid(), profiles.company_id)
  );