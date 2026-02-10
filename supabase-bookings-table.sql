create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  preferred_date date not null,
  preferred_time text not null,
  name text not null,
  phone text not null,
  email text,
  service text,
  message text,
  created_at timestamptz default now(),
  unique (preferred_date, preferred_time)
);

alter table public.bookings enable row level security;

create policy "Allow read for everyone"
  on public.bookings for select
  using (true);

create policy "Allow insert for everyone"
  on public.bookings for insert
  with check (true);
