-- Add follow-up date to bookings (run in Supabase SQL Editor)
-- Use this to remind you to call/email the client on this date after their first session.

alter table public.bookings
  add column if not exists follow_up_date date;

comment on column public.bookings.follow_up_date is 'Date to follow up with the client (e.g. a few days after first session).';
