-- Create blocked_dates table to store dates when booking is disabled
-- Run this in Supabase SQL Editor

create table if not exists public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null unique,
  reason text,
  created_at timestamptz default now(),
  created_by text -- Optional: track who blocked the date
);

comment on table public.blocked_dates is 'Dates when booking slots are blocked/frozen (clinic closed, doctor unavailable, etc.)';

-- Allow authenticated users (admin) to manage blocked dates
alter table public.blocked_dates enable row level security;

create policy "Allow read for everyone"
  on public.blocked_dates for select
  using (true);

create policy "Allow insert for authenticated users"
  on public.blocked_dates for insert
  with check (auth.role() = 'authenticated');

create policy "Allow update for authenticated users"
  on public.blocked_dates for update
  using (auth.role() = 'authenticated');

create policy "Allow delete for authenticated users"
  on public.blocked_dates for delete
  using (auth.role() = 'authenticated');

-- Index for faster lookups
create index if not exists idx_blocked_dates_date on public.blocked_dates(blocked_date);
