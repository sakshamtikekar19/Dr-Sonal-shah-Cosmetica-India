-- Run this in Supabase SQL Editor so the admin can edit and delete bookings.
-- Public can still INSERT (book) and SELECT (see booked slots). Only signed-in users can UPDATE and DELETE.

create policy "Allow update for authenticated"
  on public.bookings for update
  to authenticated
  using (true)
  with check (true);

create policy "Allow delete for authenticated"
  on public.bookings for delete
  to authenticated
  using (true);
