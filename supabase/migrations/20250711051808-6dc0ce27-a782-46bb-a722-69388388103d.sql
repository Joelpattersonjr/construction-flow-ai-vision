-- Enable real-time updates for collaborative task management

-- Set REPLICA IDENTITY FULL for tables to capture complete row data during updates
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE task_labels REPLICA IDENTITY FULL;
ALTER TABLE projects REPLICA IDENTITY FULL;
ALTER TABLE project_members_enhanced REPLICA IDENTITY FULL;

-- Add tables to the realtime publication to enable real-time functionality
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE task_labels;
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE project_members_enhanced;