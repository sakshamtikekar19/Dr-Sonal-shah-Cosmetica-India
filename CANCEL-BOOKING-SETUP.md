# Customer self-service: Cancel appointment

Customers can cancel their appointment from the **Book Appointment** page (contact.html) by entering the **WhatsApp number**, **date**, and **time slot** they used to book.

## How it works

1. Customer goes to the booking page and scrolls to **"Cancel my appointment"**.
2. Enters WhatsApp number, booking date, and time slot → clicks **"Cancel my appointment"**.
3. The system finds the booking, deletes it, and sends a WhatsApp cancellation message to the customer.
4. The slot becomes available for others to book.

They can also cancel by **WhatsApp** or **phone**; you can then delete the booking from the admin panel as before.

---

## Setup cancel booking (PostgreSQL function - avoids CORS issues)

### 1. Create the PostgreSQL function

Run the SQL in `supabase-cancel-booking-function.sql` in **Supabase Dashboard** → **SQL Editor**:

```sql
-- Copy and paste the entire contents of supabase-cancel-booking-function.sql
```

This creates a PostgreSQL function `cancel_booking()` that can be called via RPC (no CORS issues).

### 2. Optional: Deploy Edge Function for WhatsApp notifications

The cancellation works without the Edge Function, but if you want automatic WhatsApp notifications on cancel, deploy:

```bash
cd "c:\Users\Ananya\OneDrive\Desktop\Dr Shah"
npx supabase functions deploy cancel-booking
```

Or via **Supabase Dashboard** → **Edge Functions** → **Deploy** (paste code from `supabase/functions/cancel-booking/index.ts`).

### 2. Secrets

The function needs the same Supabase secrets used by other functions. In **Project Settings** → **Edge Functions** → **Secrets**, ensure you have:

- `SUPABASE_URL` – your project URL  
- `SUPABASE_SERVICE_ROLE_KEY` – service role key (for deleting the booking)  
- `SUPABASE_ANON_KEY` – (optional) used to call `send-whatsapp` for the cancellation message; if missing, the function uses the service role key.

No new secrets are required if these are already set for your project.

### 3. CORS

The function allows all origins (`*`). If you restrict CORS later, allow your site’s domain.

---

## Security

- Cancellation is allowed only when **phone + date + time** match exactly one booking.
- No login required; the combination acts as a simple “cancel token”.
- If someone guesses another person’s details, only that one booking can be cancelled. For higher security you could later add a “cancel link” sent by WhatsApp at booking time.

---

## Troubleshooting

- **CORS error / "Failed to send request"** – The site now uses a **PostgreSQL function via RPC** instead of Edge Functions, which completely avoids CORS issues. (1) **Run the SQL** in `supabase-cancel-booking-function.sql` in Supabase Dashboard → SQL Editor. (2) **Push latest code to GitHub** and hard refresh (Ctrl+F5). RPC calls go through Supabase's REST API which handles CORS properly - no configuration needed!
- **"No appointment found"** – Ask the customer to check number (with/without 91), date, and time slot.
- **"Could not cancel"** – Check Supabase Edge Function logs for `cancel-booking`; ensure secrets are set and the function can delete from `bookings` and call `send-whatsapp`.
