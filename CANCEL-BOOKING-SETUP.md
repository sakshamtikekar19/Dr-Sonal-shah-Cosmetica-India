# Customer self-service: Cancel appointment

Customers can cancel their appointment from the **Book Appointment** page (contact.html) by entering the **WhatsApp number**, **date**, and **time slot** they used to book.

## How it works

1. Customer goes to the booking page and scrolls to **"Cancel my appointment"**.
2. Enters WhatsApp number, booking date, and time slot → clicks **"Cancel my appointment"**.
3. The system finds the booking, deletes it, and sends a WhatsApp cancellation message to the customer.
4. The slot becomes available for others to book.

They can also cancel by **WhatsApp** or **phone**; you can then delete the booking from the admin panel as before.

---

## Deploy the cancel-booking Edge Function

### 1. Deploy

```bash
cd "c:\Users\Ananya\OneDrive\Desktop\Dr Shah"
supabase functions deploy cancel-booking
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

- **CORS error / "Failed to send request"** – The site now uses Supabase JS client's `functions.invoke()` which handles CORS automatically. (1) **Redeploy the Edge Function**: `npx supabase functions deploy cancel-booking`. (2) In **Edge Functions** → **cancel-booking** → **Settings**, turn **off** "Enforce JWT verification" (required). (3) **Push latest code to GitHub** and hard refresh (Ctrl+F5). If CORS still fails, ensure the Supabase JS library (`@supabase/supabase-js`) is loaded on the page (check `contact.html` includes the script tag).
- **"No appointment found"** – Ask the customer to check number (with/without 91), date, and time slot.
- **"Could not cancel"** – Check Supabase Edge Function logs for `cancel-booking`; ensure secrets are set and the function can delete from `bookings` and call `send-whatsapp`.
