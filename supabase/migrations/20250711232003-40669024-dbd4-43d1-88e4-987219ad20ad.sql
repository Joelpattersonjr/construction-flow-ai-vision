-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule due date reminders to run daily at 9 AM UTC
SELECT cron.schedule(
  'send-due-date-reminders',
  '0 9 * * *', -- Every day at 9 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://gnyflfsjaqnxgnpsshwe.supabase.co/functions/v1/send-due-date-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdueWZsZnNqYXFueGducHNzaHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MjI1NjksImV4cCI6MjA2NzQ5ODU2OX0.IpmWKi4bR2Ybf2MvqEjjb0B223t1rTQ2MZT9OA1wuoU"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);