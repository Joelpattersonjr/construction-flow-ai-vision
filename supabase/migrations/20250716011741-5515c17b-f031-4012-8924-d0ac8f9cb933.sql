-- Create schedule slots table for task scheduling
CREATE TABLE public.task_schedule_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id BIGINT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Prevent overlapping slots for same user
  CONSTRAINT no_user_time_overlap EXCLUDE USING gist (
    user_id WITH =,
    date WITH =,
    tsrange(
      (date + start_time)::timestamp,
      (date + end_time)::timestamp,
      '[)'
    ) WITH &&
  )
);

-- Create team schedule templates for recurring schedules
CREATE TABLE public.team_schedule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  work_hours_start TIME DEFAULT '08:00:00',
  work_hours_end TIME DEFAULT '17:00:00',
  break_duration_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create schedule analytics for tracking productivity
CREATE TABLE public.schedule_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  scheduled_hours DECIMAL(5,2) DEFAULT 0,
  actual_hours DECIMAL(5,2) DEFAULT 0,
  tasks_scheduled INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  efficiency_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, date)
);

-- Enable RLS on all tables
ALTER TABLE public.task_schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_schedule_slots
CREATE POLICY "Users can manage their own schedule slots"
ON public.task_schedule_slots
FOR ALL
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.company_role = 'company_admin'
    AND p.company_id = get_my_company_id()
  )
);

-- RLS policies for team_schedule_templates
CREATE POLICY "Company members can view templates"
ON public.team_schedule_templates
FOR SELECT
USING (company_id = get_my_company_id());

CREATE POLICY "Admins can manage templates"
ON public.team_schedule_templates
FOR ALL
USING (
  company_id = get_my_company_id() AND
  (created_by = auth.uid() OR current_user_is_admin())
);

-- RLS policies for schedule_analytics
CREATE POLICY "Users can view their own analytics"
ON public.schedule_analytics
FOR ALL
USING (
  user_id = auth.uid() OR
  (current_user_is_admin() AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_id AND p.company_id = get_my_company_id()
  ))
);

-- Create triggers for updated_at
CREATE TRIGGER update_task_schedule_slots_updated_at
  BEFORE UPDATE ON public.task_schedule_slots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_schedule_templates_updated_at
  BEFORE UPDATE ON public.team_schedule_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate schedule analytics
CREATE OR REPLACE FUNCTION public.calculate_schedule_efficiency(
  p_user_id UUID,
  p_date DATE
) RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  scheduled_minutes INTEGER;
  actual_minutes INTEGER;
  efficiency DECIMAL(5,2);
BEGIN
  -- Get scheduled time for the day
  SELECT COALESCE(SUM(duration_minutes), 0)
  INTO scheduled_minutes
  FROM public.task_schedule_slots
  WHERE user_id = p_user_id AND date = p_date;
  
  -- Get actual time from time entries
  SELECT COALESCE(SUM(duration_seconds / 60), 0)
  INTO actual_minutes
  FROM public.task_time_entries tte
  JOIN public.task_schedule_slots tss ON tte.task_id = tss.task_id
  WHERE tss.user_id = p_user_id 
    AND tss.date = p_date
    AND tte.user_id = p_user_id
    AND DATE(tte.start_time) = p_date;
  
  -- Calculate efficiency (actual vs scheduled)
  IF scheduled_minutes > 0 THEN
    efficiency := LEAST((actual_minutes::DECIMAL / scheduled_minutes) * 100, 100);
  ELSE
    efficiency := 0;
  END IF;
  
  RETURN efficiency;
END;
$$;