-- Fix storage policies to work with storage authentication context
-- Drop existing policies and create simpler, working ones

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view project documents if they belong to the company" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload project documents to their company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can update project documents in their company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete project documents in their company projects" ON storage.objects;

DROP POLICY IF EXISTS "Users can view project photos if they belong to the company" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload project photos to their company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can update project photos in their company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete project photos in their company projects" ON storage.objects;

DROP POLICY IF EXISTS "Users can view blueprints if they belong to the company" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload blueprints to their company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can update blueprints in their company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete blueprints in their company projects" ON storage.objects;

DROP POLICY IF EXISTS "Users can view site photos if they belong to the company" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload site photos to their company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can update site photos in their company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete site photos in their company projects" ON storage.objects;

-- Create a helper function that works with JWT claims
CREATE OR REPLACE FUNCTION public.get_user_company_from_jwt()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT company_id FROM public.profiles WHERE id = (auth.jwt() ->> 'sub')::uuid),
    NULL
  );
$$;

-- Project Documents Policies (using JWT claims)
CREATE POLICY "Users can view project documents if they belong to the company"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-documents' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_user_company_from_jwt()
  )
);

CREATE POLICY "Users can upload project documents to their company projects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-documents' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_user_company_from_jwt()
  )
);

CREATE POLICY "Users can update project documents in their company projects"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-documents' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_user_company_from_jwt()
  )
);

CREATE POLICY "Users can delete project documents in their company projects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-documents' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_user_company_from_jwt()
  )
);

-- Project Photos Policies
CREATE POLICY "Users can view project photos if they belong to the company"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-photos' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_user_company_from_jwt()
  )
);

CREATE POLICY "Users can upload project photos to their company projects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-photos' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_user_company_from_jwt()
  )
);

CREATE POLICY "Users can update project photos in their company projects"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-photos' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_user_company_from_jwt()
  )
);

CREATE POLICY "Users can delete project photos in their company projects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-photos' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_user_company_from_jwt()
  )
);

-- Blueprints Policies
CREATE POLICY "Users can view blueprints if they belong to the company"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'blueprints' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_user_company_from_jwt()
  )
);

CREATE POLICY "Users can upload blueprints to their company projects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'blueprints' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_user_company_from_jwt()
  )
);

CREATE POLICY "Users can update blueprints in their company projects"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'blueprints' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_user_company_from_jwt()
  )
);

CREATE POLICY "Users can delete blueprints in their company projects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'blueprints' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_user_company_from_jwt()
  )
);

-- Site Photos Policies
CREATE POLICY "Users can view site photos if they belong to the company"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'site-photos' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_user_company_from_jwt()
  )
);

CREATE POLICY "Users can upload site photos to their company projects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'site-photos' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_user_company_from_jwt()
  )
);

CREATE POLICY "Users can update site photos in their company projects"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'site-photos' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_user_company_from_jwt()
  )
);

CREATE POLICY "Users can delete site photos in their company projects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'site-photos' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_user_company_from_jwt()
  )
);