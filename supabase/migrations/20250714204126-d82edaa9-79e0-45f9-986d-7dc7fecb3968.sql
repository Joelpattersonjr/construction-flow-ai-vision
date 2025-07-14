-- Add the remaining missing foreign key indexes
CREATE INDEX idx_file_analytics_project_id ON public.file_analytics(project_id);
CREATE INDEX idx_file_collaborators_document_id ON public.file_collaborators(document_id);
CREATE INDEX idx_file_locks_document_id ON public.file_locks(document_id);
CREATE INDEX idx_file_versions_document_id ON public.file_versions(document_id);
CREATE INDEX idx_project_members_enhanced_project_id ON public.project_members_enhanced(project_id);
CREATE INDEX idx_project_storage_stats_project_id ON public.project_storage_stats(project_id);
CREATE INDEX idx_company_custom_fields_company_id ON public.company_custom_fields(company_id);
CREATE INDEX idx_permission_templates_company_id ON public.permission_templates(company_id);