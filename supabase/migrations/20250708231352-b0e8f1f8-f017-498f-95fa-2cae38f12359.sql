-- Fix the infinite recursion in the profiles RLS policy
-- We need to completely avoid referencing the profiles table within the policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "Enhanced profile access" ON public.profiles;

-- Create a simple policy that just allows users to see their own profile
-- For now, let's make it very simple to avoid recursion
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create a separate policy for company admins that uses a different approach
-- We'll create this as a separate permission to avoid recursion
CREATE POLICY "Company admins can view company profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- Direct check without subquery to profiles table - use the security definer functions
  current_user_is_admin() = true 
  AND current_user_company_id() = company_id
);