-- Remove the redundant "Users can view their own profile" policy
-- since the new "Company admins can view company profiles" policy already covers this
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;