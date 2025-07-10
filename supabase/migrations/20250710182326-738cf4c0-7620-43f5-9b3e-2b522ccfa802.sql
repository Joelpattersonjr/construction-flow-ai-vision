-- Fix RLS policies for storage buckets to resolve folder creation issues

-- Drop existing policies with incorrect column references
DROP POLICY IF EXISTS "Users can view project documents if they belong to the company" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload project documents to their company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can view project photos if they belong to the company" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload project photos to their company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can view blueprints if they belong to the company" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload blueprints to their company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can view site photos if they belong to the company" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload site photos to their company projects" ON storage.objects;

-- Project Documents Policies
CREATE POLICY "Users can view project documents if they belong to the company"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-documents' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_my_company_id()
  )
);

CREATE POLICY "Users can upload project documents to their company projects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-documents' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_my_company_id()
  )
);

CREATE POLICY "Users can update project documents in their company projects"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-documents' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_my_company_id()
  )
);

CREATE POLICY "Users can delete project documents in their company projects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-documents' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_my_company_id()
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
    AND p.company_id = get_my_company_id()
  )
);

CREATE POLICY "Users can upload project photos to their company projects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-photos' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_my_company_id()
  )
);

CREATE POLICY "Users can update project photos in their company projects"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-photos' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_my_company_id()
  )
);

CREATE POLICY "Users can delete project photos in their company projects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-photos' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_my_company_id()
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
    AND p.company_id = get_my_company_id()
  )
);

CREATE POLICY "Users can upload blueprints to their company projects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'blueprints' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_my_company_id()
  )
);

CREATE POLICY "Users can update blueprints in their company projects"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'blueprints' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_my_company_id()
  )
);

CREATE POLICY "Users can delete blueprints in their company projects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'blueprints' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_my_company_id()
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
    AND p.company_id = get_my_company_id()
  )
);

CREATE POLICY "Users can upload site photos to their company projects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'site-photos' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_my_company_id()
  )
);

CREATE POLICY "Users can update site photos in their company projects"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'site-photos' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_my_company_id()
  )
);

CREATE POLICY "Users can delete site photos in their company projects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'site-photos' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.company_id = get_my_company_id()
  )
);