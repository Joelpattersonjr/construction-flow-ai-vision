-- Fix Multiple Permissive Policy warning for profiles
-- Remove the separate INSERT policy and incorporate its logic into the main policy

DROP POLICY IF EXISTS "Manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Insert profile via invitation" ON public.profiles;

-- Create consolidated policy that handles all operations including the invitation logic
CREATE POLICY "Manage profiles" 
ON public.profiles 
FOR ALL 
USING (((select auth.uid()) = id) OR ((current_user_is_admin() = true) AND (current_user_company_id() = company_id)))
WITH CHECK (
  -- Users can manage their own profile OR company admins can manage company profiles
  (((select auth.uid()) = id) OR (EXISTS ( SELECT 1 FROM profiles current_user_profile WHERE ((current_user_profile.id = (select auth.uid())) AND (current_user_profile.company_role = 'company_admin'::text) AND (current_user_profile.company_id = profiles.company_id)))))
  AND 
  -- For INSERT operations, also check invitation logic
  (
    -- Allow if it's an UPDATE/DELETE operation (id already exists)
    (id IN (SELECT id FROM profiles WHERE id = (select auth.uid())))
    OR
    -- For INSERT operations, check invitation requirements
    (((select auth.uid()) = id) AND ((EXISTS ( SELECT 1 FROM user_invitations WHERE ((user_invitations.email = ((select auth.jwt()) ->> 'email'::text)) AND (user_invitations.accepted_at IS NULL) AND (user_invitations.expires_at > now())))) OR (NOT (EXISTS ( SELECT 1 FROM profiles profiles_1 WHERE (profiles_1.company_role = 'company_admin'::text)))) OR (company_role = 'company_admin'::text)))
  )
);