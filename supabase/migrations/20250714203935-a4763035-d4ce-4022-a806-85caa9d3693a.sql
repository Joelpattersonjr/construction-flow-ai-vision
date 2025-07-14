-- Remove unused indexes to improve database performance
-- These indexes are not being used by any queries and add unnecessary overhead

-- Remove unused indexes from project_members_enhanced
DROP INDEX IF EXISTS idx_project_members_enhanced_project_id;
DROP INDEX IF EXISTS idx_project_members_enhanced_user_id;

-- Remove unused indexes from audit_log
DROP INDEX IF EXISTS idx_audit_log_project_id;
DROP INDEX IF EXISTS idx_audit_log_user_id;
DROP INDEX IF EXISTS idx_audit_log_target_user_id;

-- Remove unused indexes from profiles
DROP INDEX IF EXISTS idx_profiles_company_id;
DROP INDEX IF EXISTS idx_profiles_company_role;

-- Remove unused indexes from project_members
DROP INDEX IF EXISTS idx_project_members_project_id;
DROP INDEX IF EXISTS idx_project_members_user_id;

-- Remove unused indexes from user_invitations
DROP INDEX IF EXISTS idx_user_invitations_company_id;
DROP INDEX IF EXISTS idx_user_invitations_invited_by;
DROP INDEX IF EXISTS idx_user_invitations_email;
DROP INDEX IF EXISTS idx_user_invitations_expires_at;

-- Remove unused indexes from projects
DROP INDEX IF EXISTS idx_projects_company_id;
DROP INDEX IF EXISTS idx_projects_owner_id;
DROP INDEX IF EXISTS idx_projects_status;

-- Remove unused indexes from permission_templates
DROP INDEX IF EXISTS idx_permission_templates_company_id;
DROP INDEX IF EXISTS idx_permission_templates_created_by;

-- Remove unused indexes from documents
DROP INDEX IF EXISTS idx_documents_project_id;
DROP INDEX IF EXISTS idx_documents_uploader_id;

-- Remove unused indexes from file_analytics
DROP INDEX IF EXISTS idx_file_analytics_file_id;
DROP INDEX IF EXISTS idx_file_analytics_user_id;

-- Remove unused indexes from project_storage_stats
DROP INDEX IF EXISTS idx_project_storage_stats_project_id;

-- Remove unused indexes from file_versions
DROP INDEX IF EXISTS idx_file_versions_document_id;
DROP INDEX IF EXISTS idx_file_versions_created_by;

-- Remove unused indexes from file_locks
DROP INDEX IF EXISTS idx_file_locks_document_id;
DROP INDEX IF EXISTS idx_file_locks_user_id;

-- Remove unused indexes from file_collaborators
DROP INDEX IF EXISTS idx_file_collaborators_document_id;
DROP INDEX IF EXISTS idx_file_collaborators_user_id;

-- Remove unused indexes from company_custom_fields
DROP INDEX IF EXISTS idx_company_custom_fields_company_id;

-- Remove unused indexes from admin_password_resets
DROP INDEX IF EXISTS idx_admin_password_resets_user_id;

-- Remove unused indexes from tasks
DROP INDEX IF EXISTS idx_tasks_created_by;
DROP INDEX IF EXISTS idx_tasks_priority;
DROP INDEX IF EXISTS idx_tasks_status;
DROP INDEX IF EXISTS idx_tasks_project_id;
DROP INDEX IF EXISTS idx_tasks_assignee_id;
DROP INDEX IF EXISTS idx_tasks_dependency_id;
DROP INDEX IF EXISTS idx_tasks_start_date;
DROP INDEX IF EXISTS idx_tasks_end_date;

-- Remove unused indexes from companies
DROP INDEX IF EXISTS idx_companies_owner_id;

-- Remove unused indexes from task_comments
DROP INDEX IF EXISTS idx_task_comments_task_id;
DROP INDEX IF EXISTS idx_task_comments_user_id;

-- Remove unused indexes from task_activity
DROP INDEX IF EXISTS idx_task_activity_task_id;
DROP INDEX IF EXISTS idx_task_activity_user_id;

-- Remove unused indexes from task_templates
DROP INDEX IF EXISTS idx_task_templates_company_id;
DROP INDEX IF EXISTS idx_task_templates_created_by;

-- Remove unused indexes from task_files
DROP INDEX IF EXISTS idx_task_files_task_id;
DROP INDEX IF EXISTS idx_task_files_uploaded_by;

-- Remove unused indexes from knowledge_base
DROP INDEX IF EXISTS idx_knowledge_base_company_id;
DROP INDEX IF EXISTS idx_knowledge_base_created_by;

-- Remove unused indexes from task_time_entries
DROP INDEX IF EXISTS idx_task_time_entries_task_id;
DROP INDEX IF EXISTS idx_task_time_entries_user_id;
DROP INDEX IF EXISTS idx_task_time_entries_start_time;
DROP INDEX IF EXISTS idx_task_time_entries_end_time;

-- Remove unused indexes from task_labels
DROP INDEX IF EXISTS idx_task_labels_task_id;