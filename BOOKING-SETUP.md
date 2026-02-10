# Booking slots – show booked slots and prevent double-booking

The appointment form can show which time slots are already booked and block new bookings for those slots. This uses **Supabase** (free tier) to store bookings.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up / sign in.
2. Create a new project (e.g. `dr-shah-bookings`).
3. Wait for the project to be ready, then open **Project Settings → API**.
4. Copy:
   - **Project URL** → use as `supabaseUrl`
   - **anon public** key → use as `supabaseAnonKey`

## 2. Create the `bookings` table

In Supabase, open **SQL Editor** and run:

```sql
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
```

This creates a table that stores each booking and allows only one booking per date+time (the `unique` constraint).

## 3. Add your keys to the website

Open **contact.html** and find:

```html
<script>
  window.BOOKING_CONFIG = {
    supabaseUrl: 'YOUR_SUPABASE_URL',
    supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY'
  };
</script>
```

Replace `YOUR_SUPABASE_URL` with your Project URL and `YOUR_SUPABASE_ANON_KEY` with your anon key. Save the file.

## 4. Behaviour

- When a visitor picks a **date**, the form loads booked slots for that date from Supabase and **disables** those times in the dropdown (they appear as “(Booked)”).
- On **submit**, the form first inserts the booking into Supabase. If that succeeds (slot was free), it then sends the same details to Formspree so you get the email. If the slot was already taken (e.g. someone else booked it), the user sees: *“This slot was just booked. Please choose another date or time.”*

Until you set real Supabase values in `BOOKING_CONFIG`, the form keeps working as before (no slot blocking; Formspree only).
