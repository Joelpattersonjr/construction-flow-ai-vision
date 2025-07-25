-- Update RLS policies to allow anonymous form submissions
-- First, update the form_submissions table to allow anonymous submissions

-- Drop existing policy and create new one that allows anonymous submissions
DROP POLICY IF EXISTS "Users can create submissions for their company forms" ON public.form_submissions;

CREATE POLICY "Allow form submissions from authenticated or anonymous users" 
ON public.form_submissions 
FOR INSERT 
WITH CHECK (
  -- Allow if user is authenticated and belongs to the form's company
  (
    submitted_by IS NOT NULL 
    AND submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM form_templates ft
      WHERE ft.id = form_submissions.form_template_id 
      AND ft.company_id = (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  )
  OR
  -- Allow anonymous submissions (submitted_by is NULL)
  (
    submitted_by IS NULL
    AND EXISTS (
      SELECT 1 FROM form_templates ft
      WHERE ft.id = form_submissions.form_template_id 
      AND ft.is_active = true
    )
  )
);

-- Also update the view policy to allow viewing anonymous submissions
DROP POLICY IF EXISTS "Users can view submissions for their company" ON public.form_submissions;

CREATE POLICY "Allow viewing form submissions" 
ON public.form_submissions 
FOR SELECT 
USING (
  -- Users can view submissions for their company forms
  EXISTS (
    SELECT 1 FROM form_templates ft
    WHERE ft.id = form_submissions.form_template_id 
    AND ft.company_id = (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Update form templates policy to allow public reading of active forms
CREATE POLICY "Allow public access to active form templates" 
ON public.form_templates 
FOR SELECT 
USING (is_active = true);