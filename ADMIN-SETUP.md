# Admin backend – manage appointments

The admin page lets the client (clinic owner) log in and **view, edit, and delete** all appointments. It uses **Supabase Auth** (email + password).

## 1. Enable Email auth in Supabase

1. In [Supabase Dashboard](https://supabase.com/dashboard), open your project.
2. Go to **Authentication** → **Providers**.
3. Ensure **Email** is enabled (it is by default).

## 2. Create an admin user

1. Go to **Authentication** → **Users**.
2. Click **Add user** → **Create new user**.
3. Enter the **email** and **password** the client will use to log in (e.g. clinic email).
4. Click **Create user**.  
   (You can leave “Auto Confirm User” on so they can sign in immediately.)

## 3. Allow admin to edit and delete bookings

1. Go to **SQL Editor** in Supabase.
2. Open **`supabase-admin-policies.sql`** from this project, copy its contents, and run it in the SQL Editor.  
   This adds policies so that **only signed-in users** can update and delete rows in `bookings`. The public can still book (insert) and see booked slots (select).

### (Optional) Add follow-up date column

To set a **follow-up date** for each booking (e.g. when to call/email the client after their first session), run **`supabase-bookings-follow-up-date.sql`** in the SQL Editor once. Then the Edit modal will show a “Follow-up date” field and the table will show it.

## 4. Open the admin page

- Open **`admin.html`** in your browser (same way you open the rest of the site).  
  Example: if the site is at `https://yoursite.com/`, the admin page is `https://yoursite.com/admin.html`.

- Or locally: after running `npx serve .`, go to `http://localhost:3000/admin.html`.

## 5. Sign in and manage appointments

1. Enter the **email** and **password** you created in step 2.
2. Click **Sign in**. You’ll see a table of all appointments (date, time, name, WhatsApp, email, treatment, follow-up date, message).
3. **Edit:** click **Edit** on a row, change the details in the modal (including **Follow-up date** to remind you to call/email the client after their first session), then **Save changes**.
4. **Delete:** click **Delete** and confirm. The slot becomes free again for the website form.

**Log out** when finished using the **Log out** button.

## 6. (Optional) WhatsApp confirmation and cancellation

The site can send **automatic WhatsApp** messages for booking confirmation (after a customer books) and for cancellation (when you delete a booking). This uses **Twilio** and a **Supabase Edge Function**. See **WHATSAPP-SETUP.md** for step-by-step setup (Twilio account, Sandbox, deploy Edge Function, set secrets).

## Security note

- Keep the admin URL (`admin.html`) private and only share the login email/password with the clinic owner.
- The same Supabase credentials in `booking-config.js` are used for both the public booking form and the admin page; only authenticated users can update or delete bookings.
