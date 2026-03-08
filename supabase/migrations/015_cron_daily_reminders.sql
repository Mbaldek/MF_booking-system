-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily reminders at 17:00 UTC (= 18h Paris hiver, 19h Paris été)
-- For summer (CEST), adjust to '0 16 * * *' if needed
SELECT cron.schedule(
  'daily-reminders-18h',
  '0 17 * * *',
  $$
  SELECT net.http_post(
    url := 'https://nodywhjtymmzzxllggnu.supabase.co/functions/v1/send-daily-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
