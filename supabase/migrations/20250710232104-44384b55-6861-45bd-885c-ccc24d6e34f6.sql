-- Enable real-time updates for company_custom_fields table
ALTER TABLE public.company_custom_fields REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_custom_fields;