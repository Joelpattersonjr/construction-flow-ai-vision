-- Create tables for task comments, activity tracking, and templates

-- Task Comments table
CREATE TABLE task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Task Activity Log table
CREATE TABLE task_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'created', 'updated', 'status_changed', 'assigned', 'commented', etc.
  field_name TEXT, -- which field was changed (for updates)
  old_value TEXT, -- previous value
  new_value TEXT, -- new value
  description TEXT, -- human readable description
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Task Templates table
CREATE TABLE task_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  title_template TEXT NOT NULL,
  description_template TEXT,
  priority TEXT DEFAULT 'medium',
  estimated_hours INTEGER,
  tags JSONB DEFAULT '[]',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Task Files table for attachments
CREATE TABLE task_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  storage_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('task-attachments', 'task-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on all new tables
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_comments
CREATE POLICY "Users can view comments for their company tasks" ON task_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      JOIN projects p ON t.project_id = p.id 
      WHERE t.id = task_comments.task_id 
      AND p.company_id = get_my_company_id()
    )
  );

CREATE POLICY "Users can create comments on their company tasks" ON task_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tasks t 
      JOIN projects p ON t.project_id = p.id 
      WHERE t.id = task_comments.task_id 
      AND p.company_id = get_my_company_id()
    )
  );

CREATE POLICY "Users can update their own comments" ON task_comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON task_comments
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for task_activity
CREATE POLICY "Users can view activity for their company tasks" ON task_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      JOIN projects p ON t.project_id = p.id 
      WHERE t.id = task_activity.task_id 
      AND p.company_id = get_my_company_id()
    )
  );

CREATE POLICY "System can insert activity logs" ON task_activity
  FOR INSERT WITH CHECK (true);

-- RLS Policies for task_templates
CREATE POLICY "Users can view their company templates" ON task_templates
  FOR SELECT USING (company_id = get_my_company_id());

CREATE POLICY "Users can create templates for their company" ON task_templates
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id() AND 
    created_by = auth.uid()
  );

CREATE POLICY "Users can update their own templates" ON task_templates
  FOR UPDATE USING (
    company_id = get_my_company_id() AND 
    created_by = auth.uid()
  );

CREATE POLICY "Users can delete their own templates" ON task_templates
  FOR DELETE USING (
    company_id = get_my_company_id() AND 
    created_by = auth.uid()
  );

-- RLS Policies for task_files
CREATE POLICY "Users can view files for their company tasks" ON task_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      JOIN projects p ON t.project_id = p.id 
      WHERE t.id = task_files.task_id 
      AND p.company_id = get_my_company_id()
    )
  );

CREATE POLICY "Users can upload files to their company tasks" ON task_files
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tasks t 
      JOIN projects p ON t.project_id = p.id 
      WHERE t.id = task_files.task_id 
      AND p.company_id = get_my_company_id()
    )
  );

CREATE POLICY "Users can delete files they uploaded" ON task_files
  FOR DELETE USING (uploaded_by = auth.uid());

-- Storage policies for task attachments
CREATE POLICY "Users can view task attachments for their company"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'task-attachments' AND
    EXISTS (
      SELECT 1 FROM task_files tf
      JOIN tasks t ON tf.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE tf.storage_path = name
      AND p.company_id = get_my_company_id()
    )
  );

CREATE POLICY "Users can upload task attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'task-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their uploaded attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'task-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add triggers for updated_at columns
CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON task_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add real-time support
ALTER TABLE task_comments REPLICA IDENTITY FULL;
ALTER TABLE task_activity REPLICA IDENTITY FULL;
ALTER TABLE task_templates REPLICA IDENTITY FULL;
ALTER TABLE task_files REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE task_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE task_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE task_files;