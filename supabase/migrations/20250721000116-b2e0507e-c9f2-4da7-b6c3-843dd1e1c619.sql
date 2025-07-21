-- Add updated_at column to projects table first (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'updated_at') THEN
        ALTER TABLE public.projects ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;

-- Add contract management fields
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS ntp_date DATE,
ADD COLUMN IF NOT EXISTS original_completion_date DATE,
ADD COLUMN IF NOT EXISTS current_completion_date DATE,
ADD COLUMN IF NOT EXISTS contract_duration_days INTEGER,
ADD COLUMN IF NOT EXISTS total_extensions_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS extension_history JSONB DEFAULT '[]'::jsonb;

-- Update existing projects to use end_date as current_completion_date if available
UPDATE public.projects 
SET current_completion_date = end_date,
    original_completion_date = end_date
WHERE end_date IS NOT NULL AND current_completion_date IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_projects_completion_dates ON public.projects(ntp_date, current_completion_date);