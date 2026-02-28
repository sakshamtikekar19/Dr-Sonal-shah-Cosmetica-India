-- Block specific time slots on given dates (e.g. 3-hour treatment).
-- Slot values must match the booking form: 10:00-10:30, 10:30-11:00, ... 08:30-09:00.
-- Run this in Supabase SQL Editor after blocked_dates if you use it.

create table if not exists public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null,
  start_slot text not null,
  end_slot text not null,
  reason text,
  created_at timestamptz default now()
);

comment on table public.blocked_slots is 'Time ranges blocked on specific dates (e.g. long treatment). Slots are 30-min; start_slot and end_slot are inclusive.';

alter table public.blocked_slots enable row level security;

create policy "Allow read blocked_slots"
  on public.blocked_slots for select
  using (true);

create policy "Allow insert for authenticated"
  on public.blocked_slots for insert
  with check (auth.role() = 'authenticated');

create policy "Allow update for authenticated"
  on public.blocked_slots for update
  using (auth.role() = 'authenticated');

create policy "Allow delete for authenticated"
  on public.blocked_slots for delete
  using (auth.role() = 'authenticated');

create index if not exists idx_blocked_slots_date on public.blocked_slots(blocked_date);
