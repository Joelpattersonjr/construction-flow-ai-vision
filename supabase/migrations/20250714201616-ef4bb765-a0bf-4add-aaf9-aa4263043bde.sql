-- Fix RLS performance issue: optimize auth.uid() call in knowledge_base policy
DROP POLICY IF EXISTS "Company admins can manage knowledge base" ON public.knowledge_base;

CREATE POLICY "Company admins can manage knowledge base" 
ON public.knowledge_base 
FOR ALL 
USING (
  EXISTS ( 
    SELECT 1
    FROM profiles
    WHERE profiles.id = (select auth.uid()) 
    AND profiles.company_id = knowledge_base.company_id 
    AND profiles.company_role = 'company_admin'
  )
);