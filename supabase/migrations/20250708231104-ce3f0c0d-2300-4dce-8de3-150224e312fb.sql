-- Update the security definer functions to be more robust
-- and add some debugging

CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT company_id FROM public.profiles WHERE id = auth.uid()),
    NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT company_role = 'company_admin' FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Also, let's simplify the RLS policy to make it more straightforward
DROP POLICY IF EXISTS "Company admins can view company profiles" ON public.profiles;

CREATE POLICY "Enhanced profile access" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can always see their own profile
  auth.uid() = id 
  OR 
  -- Company admins can see profiles of users in the same company
  (
    EXISTS (
      SELECT 1 FROM public.profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.company_role = 'company_admin'
      AND admin_check.company_id = profiles.company_id
    )
  )
);