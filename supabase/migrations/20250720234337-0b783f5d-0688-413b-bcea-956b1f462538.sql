-- Add back the missing index for file_analytics.file_id foreign key
-- This is needed for optimal query performance when joining on file_id
CREATE INDEX IF NOT EXISTS idx_file_analytics_file_id ON public.file_analytics(file_id);