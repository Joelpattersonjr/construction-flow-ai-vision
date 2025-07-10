-- Enable real-time for documents table
ALTER TABLE public.documents REPLICA IDENTITY FULL;

-- Add documents table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;

-- Create file analytics table for tracking file access and usage
CREATE TABLE public.file_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_id BIGINT NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'upload', 'download', 'view', 'delete'
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on file_analytics
ALTER TABLE public.file_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for file_analytics
CREATE POLICY "Users can view analytics for their company projects"
ON public.file_analytics
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM projects p
  WHERE p.id = file_analytics.project_id 
  AND p.company_id = get_my_company_id()
));

CREATE POLICY "Users can create analytics for their company projects"
ON public.file_analytics
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM projects p
  WHERE p.id = file_analytics.project_id 
  AND p.company_id = get_my_company_id()
));

-- Create indexes for better performance
CREATE INDEX idx_file_analytics_project_id ON public.file_analytics(project_id);
CREATE INDEX idx_file_analytics_file_id ON public.file_analytics(file_id);
CREATE INDEX idx_file_analytics_action_type ON public.file_analytics(action_type);
CREATE INDEX idx_file_analytics_created_at ON public.file_analytics(created_at DESC);

-- Create project storage stats table
CREATE TABLE public.project_storage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  total_files BIGINT NOT NULL DEFAULT 0,
  total_size_bytes BIGINT NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- Enable RLS on project_storage_stats
ALTER TABLE public.project_storage_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_storage_stats
CREATE POLICY "Users can view storage stats for their company projects"
ON public.project_storage_stats
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM projects p
  WHERE p.id = project_storage_stats.project_id 
  AND p.company_id = get_my_company_id()
));

CREATE POLICY "System can manage storage stats"
ON public.project_storage_stats
FOR ALL
USING (true)
WITH CHECK (true);

-- Function to update project storage stats
CREATE OR REPLACE FUNCTION update_project_storage_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.project_storage_stats (project_id, total_files, total_size_bytes)
    VALUES (NEW.project_id, 1, 0)
    ON CONFLICT (project_id) DO UPDATE SET
      total_files = project_storage_stats.total_files + 1,
      last_updated = now();
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.project_storage_stats
    SET total_files = GREATEST(0, total_files - 1),
        last_updated = now()
    WHERE project_id = OLD.project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update storage stats
CREATE TRIGGER update_storage_stats_trigger
  AFTER INSERT OR DELETE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_project_storage_stats();