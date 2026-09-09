
SELECT cron.schedule(
  'process-scheduled-posts',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mguavdrifefyzswdiqww.supabase.co/functions/v1/process-scheduled-posts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ndWF2ZHJpZmVmeXpzd2RpcXd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NzIwNzIsImV4cCI6MjA4ODU0ODA3Mn0.vm6AGKdlSZDYa-0QKSiUh7lWqkC9Y9b9Pf_f-RmAKxk"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
