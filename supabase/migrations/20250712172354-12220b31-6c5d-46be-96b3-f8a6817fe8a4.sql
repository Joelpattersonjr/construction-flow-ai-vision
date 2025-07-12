-- Create knowledge base table for AI Support
CREATE TABLE public.knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  company_id BIGINT REFERENCES public.companies(id)
);

-- Enable RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Company admins can manage knowledge base" 
ON public.knowledge_base 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = knowledge_base.company_id 
    AND profiles.company_role = 'company_admin'
  )
);

CREATE POLICY "System can read active knowledge base entries" 
ON public.knowledge_base 
FOR SELECT 
USING (is_active = true);

-- Create updated_at trigger
CREATE TRIGGER update_knowledge_base_updated_at
BEFORE UPDATE ON public.knowledge_base
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial ConexusPM knowledge base entries
INSERT INTO public.knowledge_base (category, question, answer, keywords, created_by, company_id) VALUES 
-- General Platform
('general', 'What is ConexusPM?', 'ConexusPM is a comprehensive project management platform designed for construction and project-based businesses. It provides tools for project tracking, task management, team collaboration, file management, and time tracking.', ARRAY['platform', 'overview', 'what is', 'about'], 
(SELECT id FROM auth.users LIMIT 1), 
(SELECT id FROM public.companies LIMIT 1)),

-- Projects
('projects', 'How do I create a new project?', 'To create a new project in ConexusPM: 1) Go to the Projects page, 2) Click the "New Project" button, 3) Fill in project details like name, address, dates, and owner information, 4) Save the project. You can then add team members and start creating tasks.', ARRAY['create project', 'new project', 'project setup'], 
(SELECT id FROM auth.users LIMIT 1), 
(SELECT id FROM public.companies LIMIT 1)),

('projects', 'How do I manage project members?', 'Project members can be managed through the Project Permissions page. You can add team members, assign roles (Owner, Admin, Editor, Viewer), and set specific permissions. Only project owners and company admins can modify project memberships.', ARRAY['project members', 'team', 'permissions', 'roles'], 
(SELECT id FROM auth.users LIMIT 1), 
(SELECT id FROM public.companies LIMIT 1)),

-- Tasks
('tasks', 'How do I create and assign tasks?', 'To create tasks: 1) Go to the Tasks page or specific project, 2) Click "New Task", 3) Enter task details, description, priority, and dates, 4) Assign to team members, 5) Save. Tasks can be viewed in list or Kanban board format.', ARRAY['create task', 'assign task', 'task management', 'new task'], 
(SELECT id FROM auth.users LIMIT 1), 
(SELECT id FROM public.companies LIMIT 1)),

('tasks', 'What are the different task statuses?', 'ConexusPM supports multiple task statuses including: Not Started, In Progress, Review, and Completed. You can drag tasks between columns in the Kanban view or update status in the task details.', ARRAY['task status', 'kanban', 'workflow', 'progress'], 
(SELECT id FROM auth.users LIMIT 1), 
(SELECT id FROM public.companies LIMIT 1)),

-- Files
('files', 'How do I upload and manage files?', 'Use the File Management section to upload documents, photos, and other files. You can organize files in folders, preview documents, and manage versions. Files are associated with specific projects and have permission-based access.', ARRAY['upload files', 'file management', 'documents', 'storage'], 
(SELECT id FROM auth.users LIMIT 1), 
(SELECT id FROM public.companies LIMIT 1)),

-- Time Tracking
('time', 'How does time tracking work?', 'ConexusPM includes time tracking features where you can log time spent on tasks. Start and stop timers, add time entries manually, and generate time reports. This helps with project billing and productivity analysis.', ARRAY['time tracking', 'timers', 'billing', 'reports'], 
(SELECT id FROM auth.users LIMIT 1), 
(SELECT id FROM public.companies LIMIT 1)),

-- Calendar
('calendar', 'How do I view project schedules?', 'The Calendar view shows all your project deadlines, task due dates, and milestones in a visual calendar format. You can switch between month, week, and day views to better plan your work.', ARRAY['calendar', 'schedule', 'deadlines', 'dates'], 
(SELECT id FROM auth.users LIMIT 1), 
(SELECT id FROM public.companies LIMIT 1)),

-- Account Management
('account', 'How do I manage my profile and settings?', 'Access your profile through the user menu in the top right. You can update personal information, change notification preferences, upload an avatar, and manage account settings.', ARRAY['profile', 'settings', 'account', 'notifications'], 
(SELECT id FROM auth.users LIMIT 1), 
(SELECT id FROM public.companies LIMIT 1)),

-- Troubleshooting
('support', 'What should I do if I encounter an error?', 'If you encounter errors: 1) Try refreshing the page, 2) Check your internet connection, 3) Clear browser cache, 4) Contact your company admin, 5) Use this chat for immediate help. Most issues are resolved quickly with these steps.', ARRAY['error', 'troubleshooting', 'help', 'issues'], 
(SELECT id FROM auth.users LIMIT 1), 
(SELECT id FROM public.companies LIMIT 1));