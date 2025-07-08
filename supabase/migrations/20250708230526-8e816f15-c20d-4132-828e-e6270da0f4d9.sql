-- Fix the company admin profile viewing policy
-- Drop the problematic policy and create a better one
DROP POLICY IF EXISTS "Company admins can view company member profiles" ON public.profiles;

-- Create a new policy that allows company admins to view profiles in their company
-- Using a security definer function to avoid recursion issues
CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT company_role = 'company_admin' FROM public.profiles WHERE id = auth.uid();
$$;

-- Create new policy using the security definer functions
CREATE POLICY "Company admins can view company profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can see their own profile OR admins can see profiles in their company
  auth.uid() = id 
  OR (
    public.current_user_is_admin() = true 
    AND public.current_user_company_id() = company_id
  )
);