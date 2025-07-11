-- Add missing foreign key relationships for tasks table

-- Add foreign key constraint for assignee_id -> profiles(id)
ALTER TABLE public.tasks 
ADD CONSTRAINT fk_tasks_assignee_id 
FOREIGN KEY (assignee_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add foreign key constraint for created_by -> profiles(id) 
-- (Note: created_by was originally referencing auth.users, but we should use profiles for consistency)
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;
ALTER TABLE public.tasks 
ADD CONSTRAINT fk_tasks_created_by 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;