-- Remove unused indexes that are likely redundant or not needed
-- Keep foreign key indexes and unique constraints as they are important for data integrity and future performance

-- Remove redundant single-column indexes that are covered by composite indexes
DROP INDEX IF EXISTS public.idx_task_schedule_slots_user_id; -- Redundant with idx_task_schedule_slots_user_date
DROP INDEX IF EXISTS public.idx_task_schedule_slots_task_id; -- Redundant with idx_task_schedule_slots_task_user

-- Remove single column indexes that are redundant with composite ones  
DROP INDEX IF EXISTS public.idx_file_versions_document_id; -- Redundant with file_versions_document_id_version_number_key

-- Remove potentially unused analytics indexes (can be recreated if needed)
DROP INDEX IF EXISTS public.idx_file_analytics_file_id;
DROP INDEX IF EXISTS public.idx_file_analytics_user_id;

-- Remove unused document collaboration indexes (features may not be used)
DROP INDEX IF EXISTS public.idx_file_collaborators_document_id;
DROP INDEX IF EXISTS public.idx_file_locks_document_id;
DROP INDEX IF EXISTS public.idx_file_locks_expires;

-- Remove unused task indexes that seem redundant
DROP INDEX IF EXISTS public.idx_tasks_created_by; -- May not be commonly queried
DROP INDEX IF EXISTS public.idx_tasks_dependency_id; -- Dependencies may not be heavily used
DROP INDEX IF EXISTS public.idx_tasks_project_id; -- Redundant with composite indexes

-- Remove weather cache index as it's likely not performance critical
DROP INDEX IF EXISTS public.idx_weather_cache_updated;

-- Keep the following indexes as they are important:
-- - All unique constraints (file_versions_document_id_version_number_key, schedule_analytics_user_id_date_key)
-- - Foreign key indexes for core entities (profiles, projects, companies)
-- - Composite indexes that support complex queries
-- - Indexes recently created for unindexed foreign keys