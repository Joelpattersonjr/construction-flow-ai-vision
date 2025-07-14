-- Fix RLS performance issue: optimize auth.jwt() call in profiles policy
DROP POLICY IF EXISTS "Users can insert their own profile via invitation" ON public.profiles;

CREATE POLICY "Users can insert their own profile via invitation" 
ON public.profiles 
FOR INSERT 
WITH CHECK (((select auth.uid()) = id) AND ((EXISTS ( SELECT 1 FROM user_invitations WHERE ((user_invitations.email = ((select auth.jwt()) ->> 'email'::text)) AND (user_invitations.accepted_at IS NULL) AND (user_invitations.expires_at > now())))) OR (NOT (EXISTS ( SELECT 1 FROM profiles profiles_1 WHERE (profiles_1.company_role = 'company_admin'::text)))) OR (company_role = 'company_admin'::text)));