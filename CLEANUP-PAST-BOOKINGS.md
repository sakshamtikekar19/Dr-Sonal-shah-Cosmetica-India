# Auto-cleanup past bookings

The **cleanup-past-bookings** Edge Function deletes appointments whose date and time slot have already passed (using IST). No WhatsApp is sent—these are completed or no-show appointments.

## Deploy the function

```bash
supabase functions deploy cleanup-past-bookings
```

Secrets `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set automatically for Edge Functions.

## Run on a schedule (optional)

1. **Supabase Dashboard** → **Database** → **Extensions**: enable **pg_cron** and **pg_net**.
2. **Project Settings** → **Vault**: add secrets `project_url` and `anon_key` (your project URL and anon key).
3. **SQL Editor**: run the schedule from `supabase-cleanup-past-bookings-cron.sql` (uncomment the `cron.schedule` block and fix the secret names if needed).

Or use **Dashboard** → **Edge Functions** → **cleanup-past-bookings** → **Schedule** to create a cron trigger (e.g. daily).

## Run manually

From your app or curl:

```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-past-bookings" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

Response example: `{ "deleted": 3, "ids": ["...", "...", "..."] }`.

## Optional: restrict to cron only

Set a secret `CRON_SECRET` in the Edge Function secrets. Then only requests that send `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret: <CRON_SECRET>` can run the cleanup. Use this when you trigger the function from pg_cron with a fixed secret instead of the anon key.
