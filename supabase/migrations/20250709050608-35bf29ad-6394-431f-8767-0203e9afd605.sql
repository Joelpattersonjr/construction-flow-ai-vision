-- Fix the RLS policy role - it should be for authenticated users, not public
DROP POLICY IF EXISTS "Users can create projects for their company" ON public.projects;

-- Create a new INSERT policy for authenticated users
CREATE POLICY "Users can create projects for their company" 
ON public.projects 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = owner_id 
  AND company_id = (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);