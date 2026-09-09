
-- Sync post analytics — every 6 hours
SELECT cron.schedule(
  'sync-post-analytics',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://mguavdrifefyzswdiqww.supabase.co/functions/v1/sync-post-analytics',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ndWF2ZHJpZmVmeXpzd2RpcXd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NzIwNzIsImV4cCI6MjA4ODU0ODA3Mn0.vm6AGKdlSZDYa-0QKSiUh7lWqkC9Y9b9Pf_f-RmAKxk"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Generate weekly insights — every Monday at 9am UTC
SELECT cron.schedule(
  'generate-weekly-insights',
  '0 9 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://mguavdrifefyzswdiqww.supabase.co/functions/v1/generate-weekly-insights',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ndWF2ZHJpZmVmeXpzd2RpcXd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NzIwNzIsImV4cCI6MjA4ODU0ODA3Mn0.vm6AGKdlSZDYa-0QKSiUh7lWqkC9Y9b9Pf_f-RmAKxk"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
