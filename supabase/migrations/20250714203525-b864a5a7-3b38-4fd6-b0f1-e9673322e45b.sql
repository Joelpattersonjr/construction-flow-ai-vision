-- Add indexes on foreign key columns to improve performance
-- These indexes help with JOINs, referential integrity checks, and lookups

-- Audit log foreign keys
CREATE INDEX IF NOT EXISTS idx_audit_log_project_id ON public.audit_log(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target_user_id ON public.audit_log(target_user_id);

-- Company custom fields foreign keys
CREATE INDEX IF NOT EXISTS idx_company_custom_fields_company_id ON public.company_custom_fields(company_id);

-- Documents foreign keys
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploader_id ON public.documents(uploader_id);

-- File analytics foreign keys
CREATE INDEX IF NOT EXISTS idx_file_analytics_file_id ON public.file_analytics(file_id);
CREATE INDEX IF NOT EXISTS idx_file_analytics_project_id ON public.file_analytics(project_id);
CREATE INDEX IF NOT EXISTS idx_file_analytics_user_id ON public.file_analytics(user_id);

-- File collaborators foreign keys
CREATE INDEX IF NOT EXISTS idx_file_collaborators_document_id ON public.file_collaborators(document_id);
CREATE INDEX IF NOT EXISTS idx_file_collaborators_user_id ON public.file_collaborators(user_id);

-- File locks foreign keys
CREATE INDEX IF NOT EXISTS idx_file_locks_document_id ON public.file_locks(document_id);
CREATE INDEX IF NOT EXISTS idx_file_locks_user_id ON public.file_locks(user_id);

-- File versions foreign keys
CREATE INDEX IF NOT EXISTS idx_file_versions_document_id ON public.file_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_created_by ON public.file_versions(created_by);

-- Knowledge base foreign keys
CREATE INDEX IF NOT EXISTS idx_knowledge_base_company_id ON public.knowledge_base(company_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_created_by ON public.knowledge_base(created_by);

-- Permission templates foreign keys
CREATE INDEX IF NOT EXISTS idx_permission_templates_company_id ON public.permission_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_permission_templates_created_by ON public.permission_templates(created_by);

-- Profiles foreign keys
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);

-- Project members foreign keys
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);

-- Project members enhanced foreign keys
CREATE INDEX IF NOT EXISTS idx_project_members_enhanced_project_id ON public.project_members_enhanced(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_enhanced_user_id ON public.project_members_enhanced(user_id);

-- Project storage stats foreign keys
CREATE INDEX IF NOT EXISTS idx_project_storage_stats_project_id ON public.project_storage_stats(project_id);

-- Projects foreign keys
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);

-- Task activity foreign keys
CREATE INDEX IF NOT EXISTS idx_task_activity_task_id ON public.task_activity(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_user_id ON public.task_activity(user_id);

-- Task comments foreign keys
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON public.task_comments(user_id);

-- Task files foreign keys
CREATE INDEX IF NOT EXISTS idx_task_files_task_id ON public.task_files(task_id);
CREATE INDEX IF NOT EXISTS idx_task_files_uploaded_by ON public.task_files(uploaded_by);

-- Task labels foreign keys
CREATE INDEX IF NOT EXISTS idx_task_labels_task_id ON public.task_labels(task_id);

-- Task templates foreign keys
CREATE INDEX IF NOT EXISTS idx_task_templates_company_id ON public.task_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_created_by ON public.task_templates(created_by);

-- Task time entries foreign keys
CREATE INDEX IF NOT EXISTS idx_task_time_entries_task_id ON public.task_time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_entries_user_id ON public.task_time_entries(user_id);

-- Tasks foreign keys
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_dependency_id ON public.tasks(dependency_id);

-- User invitations foreign keys
CREATE INDEX IF NOT EXISTS idx_user_invitations_company_id ON public.user_invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_invited_by ON public.user_invitations(invited_by);

-- Additional performance indexes on commonly queried columns
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON public.tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON public.tasks(end_date);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_expires_at ON public.user_invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_company_role ON public.profiles(company_role);
CREATE INDEX IF NOT EXISTS idx_task_time_entries_start_time ON public.task_time_entries(start_time);
CREATE INDEX IF NOT EXISTS idx_task_time_entries_end_time ON public.task_time_entries(end_time);