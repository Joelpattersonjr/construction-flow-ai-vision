-- Database Performance Optimization

-- 1. Add composite indexes for commonly queried combinations
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON public.tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON public.tasks(assignee_id, status) WHERE assignee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_project_created ON public.tasks(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(end_date) WHERE end_date IS NOT NULL;

-- 2. Add partial indexes for active/pending records
CREATE INDEX IF NOT EXISTS idx_user_invitations_pending ON public.user_invitations(company_id, email) WHERE accepted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_file_locks_active ON public.file_locks(document_id, user_id) WHERE expires_at > now();

-- 3. Add indexes for RLS policy optimization
CREATE INDEX IF NOT EXISTS idx_profiles_company_role ON public.profiles(company_id, company_role);
CREATE INDEX IF NOT EXISTS idx_project_members_project_user ON public.project_members_enhanced(project_id, user_id, role);

-- 4. Add text search indexes for searchable content
CREATE INDEX IF NOT EXISTS idx_projects_name_search ON public.projects USING gin(to_tsvector('english', name)) WHERE name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_title_search ON public.tasks USING gin(to_tsvector('english', title)) WHERE title IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_knowledge_base_search ON public.knowledge_base USING gin(to_tsvector('english', question || ' ' || answer));

-- 5. Add covering indexes for frequently accessed data
CREATE INDEX IF NOT EXISTS idx_documents_project_with_metadata ON public.documents(project_id, created_at DESC) INCLUDE (file_name, file_size, file_type);
CREATE INDEX IF NOT EXISTS idx_task_activity_task_with_details ON public.task_activity(task_id, created_at DESC) INCLUDE (action_type, description);

-- 6. Optimize audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_project_action ON public.audit_log(project_id, action_type, created_at DESC);

-- 7. Add indexes for reporting queries
CREATE INDEX IF NOT EXISTS idx_task_time_entries_user_date ON public.task_time_entries(user_id, start_time::date);
CREATE INDEX IF NOT EXISTS idx_file_analytics_project_date ON public.file_analytics(project_id, created_at::date);

-- 8. Update table statistics for better query planning
ANALYZE public.tasks;
ANALYZE public.projects;
ANALYZE public.profiles;
ANALYZE public.project_members_enhanced;
ANALYZE public.task_activity;
ANALYZE public.documents;