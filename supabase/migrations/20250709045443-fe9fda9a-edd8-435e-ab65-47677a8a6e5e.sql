-- Fix the RLS policy by using direct profile lookup instead of function
DROP POLICY IF EXISTS "Users can create projects for their company" ON public.projects;

-- Create a new INSERT policy that directly checks the user's company
CREATE POLICY "Users can create projects for their company" 
ON public.projects 
FOR INSERT 
WITH CHECK (
  auth.uid() = owner_id 
  AND company_id = (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);