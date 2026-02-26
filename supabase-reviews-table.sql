-- Reviews table: store submitted reviews so they appear on the website for everyone.
-- Run this in Supabase Dashboard → SQL Editor.

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rating smallint not null check (rating >= 1 and rating <= 5),
  review text not null,
  created_at timestamptz default now()
);

alter table public.reviews enable row level security;

-- Anyone can read (so the reviews page can show them)
create policy "Allow read for everyone"
  on public.reviews for select
  using (true);

-- Anyone can insert (so visitors can submit a review)
create policy "Allow insert for everyone"
  on public.reviews for insert
  with check (true);

-- Optional: allow authenticated (admin) to delete/hide inappropriate reviews
-- create policy "Allow delete for authenticated"
--   on public.reviews for delete to authenticated using (true);
