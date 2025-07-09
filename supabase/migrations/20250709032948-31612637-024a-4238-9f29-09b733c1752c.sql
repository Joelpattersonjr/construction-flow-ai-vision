-- Phase 1: Create Storage Buckets for Construction Documents
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('project-documents', 'project-documents', false),
  ('project-photos', 'project-photos', false),
  ('blueprints', 'blueprints', false),
  ('site-photos', 'site-photos', false);

-- Storage Policies for Project Documents
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

-- Storage Policies for Project Photos
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

-- Storage Policies for Blueprints
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

-- Storage Policies for Site Photos
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

-- Phase 1: Enable Realtime for Core Tables (only for tables not already added)
ALTER TABLE projects REPLICA IDENTITY FULL;
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE documents REPLICA IDENTITY FULL;
ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE user_invitations REPLICA IDENTITY FULL;

-- Add tables to realtime publication (only if not already added)
DO $$
BEGIN
  -- Add tasks if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'tasks'
  ) THEN
    ALTER publication supabase_realtime ADD TABLE tasks;
  END IF;
  
  -- Add documents if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'documents'
  ) THEN
    ALTER publication supabase_realtime ADD TABLE documents;
  END IF;
  
  -- Add profiles if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER publication supabase_realtime ADD TABLE profiles;
  END IF;
  
  -- Add user_invitations if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_invitations'
  ) THEN
    ALTER publication supabase_realtime ADD TABLE user_invitations;
  END IF;
END $$;

-- Add a trigger to update timestamps on projects
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enhanced RLS: Add more granular project member access
CREATE TABLE project_members_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'manager', 'member', 'viewer')) DEFAULT 'member',
  permissions JSONB DEFAULT '{"read": true, "write": false, "admin": false}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

ALTER TABLE project_members_enhanced ENABLE ROW LEVEL SECURITY;

-- RLS policies for enhanced project members
CREATE POLICY "Users can view project members if they belong to the company"
ON project_members_enhanced FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_members_enhanced.project_id
    AND p.company_id = get_my_company_id()
  )
);

CREATE POLICY "Project owners and company admins can manage project members"
ON project_members_enhanced FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_members_enhanced.project_id
    AND (p.owner_id = auth.uid() OR is_company_admin(p.company_id))
  )
);

-- Add updated_at trigger for project_members_enhanced
CREATE TRIGGER update_project_members_enhanced_updated_at
BEFORE UPDATE ON public.project_members_enhanced
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for new table
ALTER TABLE project_members_enhanced REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE project_members_enhanced;