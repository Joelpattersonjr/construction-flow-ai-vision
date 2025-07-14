-- Fix RLS performance issue: optimize auth.uid() call in file_versions policy
DROP POLICY IF EXISTS "Users can create versions for their company projects" ON public.file_versions;

CREATE POLICY "Users can create versions for their company projects" 
ON public.file_versions 
FOR INSERT 
WITH CHECK (
  (EXISTS ( 
    SELECT 1
    FROM (documents d
      JOIN projects p ON ((d.project_id = p.id)))
    WHERE ((d.id = file_versions.document_id) AND (p.company_id = get_my_company_id()))
  )) 
  AND (created_by = (select auth.uid()))
);