-- Add policy to allow company admins to update company members' profiles
CREATE POLICY "Company admins can update company profiles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles current_user_profile 
    WHERE current_user_profile.id = auth.uid() 
    AND current_user_profile.company_id = profiles.company_id 
    AND current_user_profile.company_role = 'company_admin'
  )
);