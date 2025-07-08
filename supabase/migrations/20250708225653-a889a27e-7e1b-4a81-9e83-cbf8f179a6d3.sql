-- Add RLS policy to allow company admins to view profiles in their company
CREATE POLICY "Company admins can view company member profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.company_id = profiles.company_id 
    AND admin_profile.company_role = 'company_admin'
  )
);