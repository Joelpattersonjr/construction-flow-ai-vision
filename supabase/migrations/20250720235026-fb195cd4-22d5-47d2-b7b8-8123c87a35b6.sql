-- Add missing indexes for foreign key constraints without covering indexes

-- Index for file_analytics.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_file_analytics_user_id ON public.file_analytics(user_id);

-- Index for tasks.created_by foreign key  
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);

-- Index for tasks.dependency_id foreign key
CREATE INDEX IF NOT EXISTS idx_tasks_dependency_id ON public.tasks(dependency_id);