-- Add contract management fields to projects table
ALTER TABLE public.projects 
ADD COLUMN ntp_date DATE,
ADD COLUMN original_completion_date DATE,
ADD COLUMN current_completion_date DATE,
ADD COLUMN contract_duration_days INTEGER,
ADD COLUMN total_extensions_days INTEGER DEFAULT 0,
ADD COLUMN extension_history JSONB DEFAULT '[]'::jsonb;

-- Update existing projects to use end_date as current_completion_date if available
UPDATE public.projects 
SET current_completion_date = end_date,
    original_completion_date = end_date
WHERE end_date IS NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_projects_completion_dates ON public.projects(ntp_date, current_completion_date);