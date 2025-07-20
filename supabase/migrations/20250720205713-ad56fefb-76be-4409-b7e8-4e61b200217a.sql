-- Create indexes for unindexed foreign keys to improve performance

-- Index for daily_report_team_members.daily_report_id
CREATE INDEX IF NOT EXISTS idx_daily_report_team_members_daily_report_id 
ON public.daily_report_team_members(daily_report_id);

-- Index for task_schedule_slots.task_id  
CREATE INDEX IF NOT EXISTS idx_task_schedule_slots_task_id 
ON public.task_schedule_slots(task_id);

-- Index for task_schedule_slots.user_id
CREATE INDEX IF NOT EXISTS idx_task_schedule_slots_user_id 
ON public.task_schedule_slots(user_id);

-- Index for team_schedule_templates.company_id
CREATE INDEX IF NOT EXISTS idx_team_schedule_templates_company_id 
ON public.team_schedule_templates(company_id);

-- Index for team_schedule_templates.created_by
CREATE INDEX IF NOT EXISTS idx_team_schedule_templates_created_by 
ON public.team_schedule_templates(created_by);

-- Composite index for task_schedule_slots(user_id, date) for common queries
CREATE INDEX IF NOT EXISTS idx_task_schedule_slots_user_date 
ON public.task_schedule_slots(user_id, date);

-- Composite index for task_schedule_slots(task_id, user_id) for overlap checks
CREATE INDEX IF NOT EXISTS idx_task_schedule_slots_task_user 
ON public.task_schedule_slots(task_id, user_id);