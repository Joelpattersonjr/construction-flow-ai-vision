-- Add version control functionality to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'text/plain',
ADD COLUMN IF NOT EXISTS is_editable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;

-- Create file_versions table for storing document revisions
CREATE TABLE IF NOT EXISTS public.file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id BIGINT NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  change_description TEXT DEFAULT 'Auto-save',
  file_size BIGINT DEFAULT 0,
  UNIQUE(document_id, version_number)
);

-- Create file_locks table for managing collaborative editing sessions
CREATE TABLE IF NOT EXISTS public.file_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id BIGINT NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  locked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 minutes'),
  session_data JSONB DEFAULT '{}',
  UNIQUE(document_id, user_id)
);

-- Create file_collaborators table for tracking active editors
CREATE TABLE IF NOT EXISTS public.file_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id BIGINT NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  cursor_position INTEGER DEFAULT 0,
  selection_start INTEGER,
  selection_end INTEGER,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_color TEXT,
  UNIQUE(document_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for file_versions
CREATE POLICY "Users can view versions for their company projects" ON public.file_versions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    JOIN public.projects p ON d.project_id = p.id
    WHERE d.id = file_versions.document_id 
    AND p.company_id = get_my_company_id()
  )
);

CREATE POLICY "Users can create versions for their company projects" ON public.file_versions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.documents d
    JOIN public.projects p ON d.project_id = p.id
    WHERE d.id = file_versions.document_id 
    AND p.company_id = get_my_company_id()
  )
  AND created_by = auth.uid()
);

-- RLS Policies for file_locks
CREATE POLICY "Users can manage locks for their company projects" ON public.file_locks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    JOIN public.projects p ON d.project_id = p.id
    WHERE d.id = file_locks.document_id 
    AND p.company_id = get_my_company_id()
  )
);

-- RLS Policies for file_collaborators
CREATE POLICY "Users can manage collaborators for their company projects" ON public.file_collaborators
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    JOIN public.projects p ON d.project_id = p.id
    WHERE d.id = file_collaborators.document_id 
    AND p.company_id = get_my_company_id()
  )
);

-- Function to automatically create version on document save
CREATE OR REPLACE FUNCTION public.create_document_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  -- Only create version if content actually changed
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 
    INTO next_version
    FROM public.file_versions 
    WHERE document_id = NEW.id;
    
    -- Create new version
    INSERT INTO public.file_versions (
      document_id,
      version_number,
      content,
      content_hash,
      created_by,
      file_size,
      change_description
    ) VALUES (
      NEW.id,
      next_version,
      NEW.content,
      encode(sha256(NEW.content::bytea), 'hex'),
      auth.uid(),
      length(NEW.content),
      'Auto-save'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create versions automatically
DROP TRIGGER IF EXISTS create_version_on_update ON public.documents;
CREATE TRIGGER create_version_on_update
  AFTER UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.create_document_version();

-- Function to clean up expired locks
CREATE OR REPLACE FUNCTION public.cleanup_expired_locks()
RETURNS void AS $$
BEGIN
  DELETE FROM public.file_locks 
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update collaborator activity
CREATE OR REPLACE FUNCTION public.update_collaborator_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update activity timestamp
DROP TRIGGER IF EXISTS update_activity_on_change ON public.file_collaborators;
CREATE TRIGGER update_activity_on_change
  BEFORE UPDATE ON public.file_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION public.update_collaborator_activity();

-- Add realtime support for new tables
ALTER TABLE public.file_versions REPLICA IDENTITY FULL;
ALTER TABLE public.file_locks REPLICA IDENTITY FULL;
ALTER TABLE public.file_collaborators REPLICA IDENTITY FULL;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.file_versions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.file_locks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.file_collaborators;