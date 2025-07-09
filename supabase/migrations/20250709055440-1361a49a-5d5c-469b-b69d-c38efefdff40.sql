-- Enable realtime for project_members_enhanced table
ALTER TABLE public.project_members_enhanced REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_members_enhanced;

-- Enable realtime for audit_log table
ALTER TABLE public.audit_log REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_log;