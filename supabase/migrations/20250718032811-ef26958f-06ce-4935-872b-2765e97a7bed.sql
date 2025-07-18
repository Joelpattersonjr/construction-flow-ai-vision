-- Create daily reports table
CREATE TABLE public.daily_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  report_date DATE NOT NULL,
  created_by UUID NOT NULL,
  weather_conditions TEXT,
  temperature_high INTEGER,
  temperature_low INTEGER,
  work_hours_start TIME,
  work_hours_end TIME,
  crew_count INTEGER DEFAULT 0,
  safety_incidents INTEGER DEFAULT 0,
  progress_summary TEXT,
  work_completed TEXT,
  delays_issues TEXT,
  materials_delivered TEXT,
  equipment_status TEXT,
  visitors TEXT,
  photos_taken INTEGER DEFAULT 0,
  overall_progress_percentage DECIMAL(5,2) DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(project_id, report_date)
);

-- Enable RLS
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for daily reports
CREATE POLICY "Users can view daily reports for their company projects"
ON public.daily_reports
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM projects p
  WHERE p.id = daily_reports.project_id 
  AND p.company_id = get_my_company_id()
));

CREATE POLICY "Users can create daily reports for their company projects"
ON public.daily_reports
FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = daily_reports.project_id 
    AND p.company_id = get_my_company_id()
  )
);

CREATE POLICY "Users can update their own daily reports"
ON public.daily_reports
FOR UPDATE
USING (
  created_by = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = daily_reports.project_id 
    AND p.company_id = get_my_company_id()
  )
);

CREATE POLICY "Users can delete their own daily reports"
ON public.daily_reports
FOR DELETE
USING (
  created_by = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = daily_reports.project_id 
    AND p.company_id = get_my_company_id()
  )
);

-- Create daily report team members table
CREATE TABLE public.daily_report_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_report_id UUID NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  hours_worked DECIMAL(4,2) DEFAULT 0,
  role_description TEXT,
  tasks_completed TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for team members
ALTER TABLE public.daily_report_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage team members for their company daily reports"
ON public.daily_report_team_members
FOR ALL
USING (EXISTS (
  SELECT 1 FROM daily_reports dr
  JOIN projects p ON p.id = dr.project_id
  WHERE dr.id = daily_report_team_members.daily_report_id
  AND p.company_id = get_my_company_id()
));

-- Create trigger for updating updated_at
CREATE TRIGGER update_daily_reports_updated_at
BEFORE UPDATE ON public.daily_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();