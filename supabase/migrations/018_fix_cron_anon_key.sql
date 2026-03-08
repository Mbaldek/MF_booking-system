-- Fix: use anon key instead of service_role_key (which is NULL via current_setting)
-- send-daily-reminders is deployed with --no-verify-jwt, so anon key is sufficient

SELECT cron.unschedule('daily-reminders-18h');

SELECT cron.schedule(
  'daily-reminders-18h',
  '0 17 * * *',
  $$
  SELECT net.http_post(
    url := 'https://nodywhjtymmzzxllggnu.supabase.co/functions/v1/send-daily-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vZHl3aGp0eW1tenp4bGxnZ251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNzExODMsImV4cCI6MjA4Nzc0NzE4M30.EI1dShtkxoElVDLKH5GyzPCFqT8EdETP_bU1zqrYyFI'
    ),
    body := '{}'::jsonb
  );
  $$
);
