-- Fix Multiple Permissive Policy warning for profiles by separating operations
-- Create distinct policies for each operation to avoid overlapping permissions

DROP POLICY IF EXISTS "Manage profiles" ON public.profiles;

-- Separate SELECT policy
CREATE POLICY "View profiles" 
ON public.profiles 
FOR SELECT 
USING (((select auth.uid()) = id) OR ((current_user_is_admin() = true) AND (current_user_company_id() = company_id)));

-- Separate INSERT policy with invitation logic
CREATE POLICY "Insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (((select auth.uid()) = id) AND ((EXISTS ( SELECT 1 FROM user_invitations WHERE ((user_invitations.email = ((select auth.jwt()) ->> 'email'::text)) AND (user_invitations.accepted_at IS NULL) AND (user_invitations.expires_at > now())))) OR (NOT (EXISTS ( SELECT 1 FROM profiles profiles_1 WHERE (profiles_1.company_role = 'company_admin'::text)))) OR (company_role = 'company_admin'::text)));

-- Separate UPDATE policy
CREATE POLICY "Update profiles" 
ON public.profiles 
FOR UPDATE 
USING (((select auth.uid()) = id) OR (EXISTS ( SELECT 1 FROM profiles current_user_profile WHERE ((current_user_profile.id = (select auth.uid())) AND (current_user_profile.company_role = 'company_admin'::text) AND (current_user_profile.company_id = profiles.company_id)))))
WITH CHECK (((select auth.uid()) = id) OR (EXISTS ( SELECT 1 FROM profiles current_user_profile WHERE ((current_user_profile.id = (select auth.uid())) AND (current_user_profile.company_role = 'company_admin'::text) AND (current_user_profile.company_id = profiles.company_id)))));

-- Separate DELETE policy  
CREATE POLICY "Delete profiles" 
ON public.profiles 
FOR DELETE 
USING ((select auth.uid()) = id);