-- Database Performance Optimization (Final)

-- 1. Add composite indexes for commonly queried combinations
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON public.tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON public.tasks(assignee_id, status) WHERE assignee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_project_created ON public.tasks(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(end_date) WHERE end_date IS NOT NULL;

-- 2. Add partial indexes for active/pending records
CREATE INDEX IF NOT EXISTS idx_user_invitations_pending ON public.user_invitations(company_id, email) WHERE accepted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_file_locks_expires ON public.file_locks(expires_at DESC);

-- 3. Add indexes for RLS policy optimization
CREATE INDEX IF NOT EXISTS idx_profiles_company_role ON public.profiles(company_id, company_role);
CREATE INDEX IF NOT EXISTS idx_project_members_project_user ON public.project_members_enhanced(project_id, user_id, role);

-- 4. Add covering indexes for frequently accessed data
CREATE INDEX IF NOT EXISTS idx_documents_project_with_metadata ON public.documents(project_id, created_at DESC) INCLUDE (file_name, file_size, file_type);
CREATE INDEX IF NOT EXISTS idx_task_activity_task_with_details ON public.task_activity(task_id, created_at DESC) INCLUDE (action_type, description);

-- 5. Optimize audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_project_action ON public.audit_log(project_id, action_type, created_at DESC);

-- 6. Add indexes for time-based queries
CREATE INDEX IF NOT EXISTS idx_task_time_entries_user_start ON public.task_time_entries(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_file_analytics_project_created ON public.file_analytics(project_id, created_at DESC);

-- 7. Update table statistics for better query planning
ANALYZE public.tasks;
ANALYZE public.projects;
ANALYZE public.profiles;
ANALYZE public.project_members_enhanced;
ANALYZE public.task_activity;
ANALYZE public.documents;