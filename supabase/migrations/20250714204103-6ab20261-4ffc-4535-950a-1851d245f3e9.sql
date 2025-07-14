-- Re-add essential foreign key indexes for performance
-- These are needed for JOINs, referential integrity checks, and cascading operations

-- Add foreign key indexes that are actually needed
CREATE INDEX idx_companies_owner_id ON public.companies(owner_id);
CREATE INDEX idx_documents_project_id ON public.documents(project_id);
CREATE INDEX idx_documents_uploader_id ON public.documents(uploader_id);
CREATE INDEX idx_file_analytics_file_id ON public.file_analytics(file_id);
CREATE INDEX idx_file_analytics_user_id ON public.file_analytics(user_id);
CREATE INDEX idx_file_collaborators_user_id ON public.file_collaborators(user_id);
CREATE INDEX idx_file_locks_user_id ON public.file_locks(user_id);
CREATE INDEX idx_file_versions_created_by ON public.file_versions(created_by);
CREATE INDEX idx_knowledge_base_company_id ON public.knowledge_base(company_id);
CREATE INDEX idx_knowledge_base_created_by ON public.knowledge_base(created_by);
CREATE INDEX idx_permission_templates_created_by ON public.permission_templates(created_by);
CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX idx_project_members_enhanced_user_id ON public.project_members_enhanced(user_id);
CREATE INDEX idx_projects_company_id ON public.projects(company_id);
CREATE INDEX idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX idx_task_activity_task_id ON public.task_activity(task_id);
CREATE INDEX idx_task_activity_user_id ON public.task_activity(user_id);
CREATE INDEX idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON public.task_comments(user_id);
CREATE INDEX idx_task_files_task_id ON public.task_files(task_id);
CREATE INDEX idx_task_files_uploaded_by ON public.task_files(uploaded_by);
CREATE INDEX idx_task_labels_task_id ON public.task_labels(task_id);
CREATE INDEX idx_task_templates_company_id ON public.task_templates(company_id);
CREATE INDEX idx_task_templates_created_by ON public.task_templates(created_by);
CREATE INDEX idx_task_time_entries_task_id ON public.task_time_entries(task_id);
CREATE INDEX idx_task_time_entries_user_id ON public.task_time_entries(user_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX idx_tasks_dependency_id ON public.tasks(dependency_id);
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_user_invitations_company_id ON public.user_invitations(company_id);
CREATE INDEX idx_user_invitations_invited_by ON public.user_invitations(invited_by);

-- Remove the one remaining unused index
DROP INDEX IF EXISTS idx_file_analytics_created_at;