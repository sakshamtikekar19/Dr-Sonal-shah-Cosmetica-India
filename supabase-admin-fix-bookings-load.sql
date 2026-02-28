-- Fix: "Failed to load" / "Error loading appointments" in admin dashboard after login
-- Run this in Supabase Dashboard → SQL Editor if the admin can log in but bookings don't load.
-- This lets authenticated users (admin) SELECT from bookings and blocked_dates.
-- If you get an error on blocked_dates (e.g. table does not exist), run only the first two statements (bookings part).

-- Allow authenticated users to read all bookings (admin dashboard)
drop policy if exists "Allow authenticated read bookings" on public.bookings;
create policy "Allow authenticated read bookings"
  on public.bookings for select
  to authenticated
  using (true);

-- Allow authenticated to read blocked_dates (Block Dates modal). Skip if you don't have blocked_dates table yet.
drop policy if exists "Allow authenticated read blocked_dates" on public.blocked_dates;
create policy "Allow authenticated read blocked_dates"
  on public.blocked_dates for select
  to authenticated
  using (true);
