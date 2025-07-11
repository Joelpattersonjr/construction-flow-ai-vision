-- Enable real-time updates for collaborative task management

-- Set REPLICA IDENTITY FULL for tables to capture complete row data during updates
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE task_labels REPLICA IDENTITY FULL;
ALTER TABLE projects REPLICA IDENTITY FULL;
ALTER TABLE project_members_enhanced REPLICA IDENTITY FULL;

-- Add only the tables that aren't already in the realtime publication
DO $$
BEGIN
  -- Try to add each table, ignore errors if already exists
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE task_labels;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, skip
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE projects;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, skip
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE project_members_enhanced;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, skip
  END;
END $$;