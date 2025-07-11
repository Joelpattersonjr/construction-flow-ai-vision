-- Phase 1: Task Management Database Schema Improvements

-- Fix existing tasks table issues and add missing fields
ALTER TABLE public.tasks 
  ALTER COLUMN dependency_id DROP NOT NULL,
  ADD COLUMN description TEXT,
  ADD COLUMN priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Create task_labels table for flexible categorization
CREATE TABLE public.task_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id BIGINT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  label_name TEXT NOT NULL,
  label_color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on task_labels
ALTER TABLE public.task_labels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for task_labels
CREATE POLICY "Users can manage task labels for their company projects" 
ON public.task_labels 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.projects p ON t.project_id = p.id
    WHERE t.id = task_labels.task_id 
    AND p.company_id = get_my_company_id()
  )
);

-- Add trigger to update updated_at on tasks
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_task_labels_task_id ON public.task_labels(task_id);
CREATE INDEX idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_status ON public.tasks(status);