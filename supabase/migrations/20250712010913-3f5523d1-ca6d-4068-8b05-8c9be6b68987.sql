-- Create task time tracking table
CREATE TABLE public.task_time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id BIGINT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_time_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for time entries
CREATE POLICY "Users can view time entries for their company tasks"
ON public.task_time_entries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN projects p ON t.project_id = p.id
    WHERE t.id = task_time_entries.task_id 
    AND p.company_id = get_my_company_id()
  )
);

CREATE POLICY "Users can create their own time entries"
ON public.task_time_entries
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN projects p ON t.project_id = p.id
    WHERE t.id = task_time_entries.task_id 
    AND p.company_id = get_my_company_id()
  )
);

CREATE POLICY "Users can update their own time entries"
ON public.task_time_entries
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own time entries"
ON public.task_time_entries
FOR DELETE
USING (user_id = auth.uid());

-- Create trigger for automatic updated_at timestamp
CREATE TRIGGER update_task_time_entries_updated_at
  BEFORE UPDATE ON public.task_time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically calculate duration when end_time is set
CREATE OR REPLACE FUNCTION public.calculate_time_entry_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate duration
CREATE TRIGGER calculate_duration_on_time_entry
  BEFORE INSERT OR UPDATE ON public.task_time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_time_entry_duration();