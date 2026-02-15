-- Optional: run the cleanup-past-bookings Edge Function on a schedule (e.g. daily at 1 AM IST).
-- Requires: pg_cron and pg_net enabled (Supabase Dashboard → Database → Extensions).
-- Store your project URL and anon key in Vault (Dashboard → Project Settings → Vault), then run this.

-- 1) Store secrets in Vault (run once, replace with your values):
--    INSERT INTO vault.secrets (name, secret) VALUES
--    ('project_url', 'https://YOUR_PROJECT_REF.supabase.co'),
--    ('anon_key', 'YOUR_ANON_KEY')
--    ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret;

-- 2) Schedule daily at 01:00 UTC (06:30 IST) – adjust cron expression as needed:
/*
SELECT cron.schedule(
  'cleanup-past-bookings-daily',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/cleanup-past-bookings',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
*/

-- To remove the schedule later:
-- SELECT cron.unschedule('cleanup-past-bookings-daily');
