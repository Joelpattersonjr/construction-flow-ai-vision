-- Remove unused indexes that are confirmed to be redundant or unnecessary
-- Based on pg_stat_user_indexes analysis showing 0 usage

-- Remove the redundant user_id index we were asked about earlier
DROP INDEX IF EXISTS public.idx_project_members_enhanced_user_id;

-- Remove unused document uploader index (documents queries don't typically filter by uploader)
DROP INDEX IF EXISTS public.idx_documents_uploader_id;

-- Remove unused company owner index (owner queries are rare)  
DROP INDEX IF EXISTS public.idx_companies_owner_id;

-- Remove unused knowledge base indexes (feature may not be actively used)
DROP INDEX IF EXISTS public.idx_knowledge_base_company_id;
DROP INDEX IF EXISTS public.idx_knowledge_base_created_by;

-- Remove unused permission template indexes (except unique constraints which are actively used)
DROP INDEX IF EXISTS public.idx_permission_templates_company_id;
DROP INDEX IF EXISTS public.idx_permission_templates_created_by;

-- Remove unused composite profile indexes (single company_id index covers most queries)
DROP INDEX IF EXISTS public.idx_profiles_company_id;
DROP INDEX IF EXISTS public.idx_profiles_company_role;

-- Remove unused project member index
DROP INDEX IF EXISTS public.idx_project_members_project_id;

-- Remove unused project indexes 
DROP INDEX IF EXISTS public.idx_projects_company_id;
DROP INDEX IF EXISTS public.idx_projects_owner_id;

-- Remove unused daily report index
DROP INDEX IF EXISTS public.idx_daily_report_team_members_daily_report_id;

-- Keep the following important indexes:
-- - All primary keys and unique constraints (actively used)
-- - Foreign key indexes for core tables (projects, tasks, users)
-- - Composite indexes supporting complex queries
-- - Recently added foreign key indexes we just created