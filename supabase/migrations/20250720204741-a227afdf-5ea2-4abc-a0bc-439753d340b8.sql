-- Fix remaining RLS performance issues with auth.uid() calls

-- Fix task_comments policies  
DROP POLICY IF EXISTS "Users can create comments on their company tasks" ON public.task_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.task_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.task_comments;

CREATE POLICY "Users can create comments on their company tasks"
ON public.task_comments
FOR INSERT
WITH CHECK ((user_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM (tasks t
     JOIN projects p ON ((t.project_id = p.id)))
  WHERE ((t.id = task_comments.task_id) AND (p.company_id = get_my_company_id())))));

CREATE POLICY "Users can delete their own comments"
ON public.task_comments
FOR DELETE
USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own comments"
ON public.task_comments
FOR UPDATE
USING (user_id = (select auth.uid()));

-- Fix task_files policies
DROP POLICY IF EXISTS "Users can delete files they uploaded" ON public.task_files;
DROP POLICY IF EXISTS "Users can upload files to their company tasks" ON public.task_files;

CREATE POLICY "Users can delete files they uploaded"
ON public.task_files
FOR DELETE
USING (uploaded_by = (select auth.uid()));

CREATE POLICY "Users can upload files to their company tasks"
ON public.task_files
FOR INSERT
WITH CHECK ((uploaded_by = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM (tasks t
     JOIN projects p ON ((t.project_id = p.id)))
  WHERE ((t.id = task_files.task_id) AND (p.company_id = get_my_company_id())))));

-- Fix task_templates policies
DROP POLICY IF EXISTS "Users can create templates for their company" ON public.task_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.task_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.task_templates;

CREATE POLICY "Users can create templates for their company"
ON public.task_templates
FOR INSERT
WITH CHECK ((company_id = get_my_company_id()) AND (created_by = (select auth.uid())));

CREATE POLICY "Users can delete their own templates"
ON public.task_templates
FOR DELETE
USING ((company_id = get_my_company_id()) AND (created_by = (select auth.uid())));

CREATE POLICY "Users can update their own templates"
ON public.task_templates
FOR UPDATE
USING ((company_id = get_my_company_id()) AND (created_by = (select auth.uid())));

-- Fix task_time_entries policies
DROP POLICY IF EXISTS "Users can create their own time entries" ON public.task_time_entries;
DROP POLICY IF EXISTS "Users can delete their own time entries" ON public.task_time_entries;
DROP POLICY IF EXISTS "Users can update their own time entries" ON public.task_time_entries;

CREATE POLICY "Users can create their own time entries"
ON public.task_time_entries
FOR INSERT
WITH CHECK ((user_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM (tasks t
     JOIN projects p ON ((t.project_id = p.id)))
  WHERE ((t.id = task_time_entries.task_id) AND (p.company_id = get_my_company_id())))));

CREATE POLICY "Users can delete their own time entries"
ON public.task_time_entries
FOR DELETE
USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own time entries"
ON public.task_time_entries
FOR UPDATE
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));