# Block Booking Dates Feature

This feature allows admins to block/freeze booking slots for specific dates (e.g., when the clinic is closed or the doctor is unavailable).

## Setup

### Step 1: Create blocked_dates table

Run this SQL in **Supabase SQL Editor**:

```sql
-- Create blocked_dates table to store dates when booking is disabled
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
```

Or use the file: **`supabase-blocked-dates-table.sql`**

---

## How to Use

### Block a Date

1. Log in to **Admin Panel** (`admin.html`)
2. Click **"Block Dates"** button (top right)
3. Select the date you want to block
4. Optionally add a reason (e.g., "Clinic closed", "Doctor unavailable")
5. Click **"Block Date"**

### View Blocked Dates

- In the **Block Dates** modal, you'll see a list of all blocked dates
- Each blocked date shows the date and reason (if provided)

### Unblock a Date

1. Open **Block Dates** modal
2. Find the date in the **Blocked Dates** list
3. Click **"Unblock"** button next to the date
4. Confirm the action

---

## How It Works

### For Customers

- When a customer selects a blocked date in the booking form, they'll see: *"This date is blocked. Please select another date."*
- Time slots are disabled for blocked dates
- Customers cannot submit bookings for blocked dates

### For Admins

- Blocked dates are stored in the `blocked_dates` table
- Only authenticated admins can block/unblock dates
- Blocked dates are checked in real-time when customers try to book

---

## Technical Details

- **Table:** `blocked_dates` in Supabase
- **Fields:**
  - `blocked_date` (date) - The date to block
  - `reason` (text, optional) - Why the date is blocked
  - `created_at` (timestamp) - When the date was blocked
- **Security:** Only authenticated users (admins) can manage blocked dates
- **Public Read:** Everyone can read blocked dates (needed for booking form)

---

## Troubleshooting

### Dates not blocking

- Check if `blocked_dates` table exists in Supabase
- Verify RLS policies are set correctly
- Check browser console for errors

### Can't block dates

- Make sure you're logged in as admin
- Check Supabase RLS policies allow authenticated users to insert

---

**Note:** Blocked dates prevent ALL bookings for that day. If you need to block specific time slots only, you can create bookings with a special status or use a different approach.
