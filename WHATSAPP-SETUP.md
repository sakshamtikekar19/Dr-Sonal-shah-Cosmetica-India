# WhatsApp booking confirmation and cancellation

The site can send **automatic WhatsApp messages** to the customer:

- **Booking confirmation** – right after they book on the website (date, time, treatment).
- **Cancellation** – when you delete a booking in the admin panel.

This uses **Twilio’s WhatsApp API** and a **Supabase Edge Function**. No email setup is required for these messages.

---

## 1. Twilio account and WhatsApp Sandbox

1. Sign up at [twilio.com](https://www.twilio.com/try-twilio).
2. Open **Messaging** → **Try it out** → **Send a WhatsApp message** (or go to [Twilio WhatsApp Sandbox](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)).
3. **Join the Sandbox**: from your WhatsApp app, send the join message to the Sandbox number (e.g. `join <code>`). You need this so the Sandbox can send messages.
4. Note:
   - **Account SID** and **Auth Token**: [Twilio Console](https://console.twilio.com) → first page.
   - **Sandbox “From” number**: on the WhatsApp Sandbox page (e.g. `+14155238886`). You will use it as `whatsapp:+14155238886`.

**Important:** In the Sandbox, **only numbers that have joined the Sandbox** can receive messages. For real customers, you will need to move to a full WhatsApp Business sender (Twilio or Meta) later.

---

## 2. Deploy the Edge Function (Supabase)

The project includes a Supabase Edge Function that sends WhatsApp via Twilio.

1. Install Supabase CLI (if needed):
   ```bash
   npm install -g supabase
   ```
2. Log in and link the project:
   ```bash
   supabase login
   cd "c:\Users\Ananya\OneDrive\Desktop\Dr Shah"
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   Get **Project ref** from Supabase Dashboard → **Settings** → **General** (e.g. `tkiaemsczjuyvjoblbhp`).

3. Set Twilio secrets (replace with your values):
   ```bash
   supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
   supabase secrets set TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```
   Use your **Sandbox “From” number** with the `whatsapp:` prefix for `TWILIO_WHATSAPP_FROM`.

4. Deploy the function:
   ```bash
   supabase functions deploy send-whatsapp
   ```

---

## 3. Allow the frontend to call the function

By default, Supabase Edge Functions can be invoked with the project’s **anon** key (same as in `booking-config.js`). No extra config is needed in the HTML/JS.

- **Booking**: after a successful booking, the site calls `send-whatsapp` with `type: 'confirm'`.
- **Admin delete**: when you click Delete, the site calls `send-whatsapp` with `type: 'cancel'`, then deletes the row.

---

## 4. Message content

- **Confirmation:**  
  *“Hi [Name], your appointment at Dr Sonal Shah Cosmetica India is confirmed. Date: [date], Time: [time]. Treatment: [service]. For any change, call or WhatsApp us.”*

- **Cancellation:**  
  *“Hi [Name], your appointment at Dr Sonal Shah Cosmetica India on [date] at [time] has been cancelled. To book again, visit our website or WhatsApp +91 98704 39934.”*

To change the wording, edit `supabase/functions/send-whatsapp/index.ts` (function `getMessage`) and redeploy.

---

## 5. How to get Twilio WhatsApp production (send to any patient)

To send WhatsApp to **any** patient (not only Sandbox test numbers), you need a **production** WhatsApp sender. Summary of steps:

### Step 1: Upgrade Twilio account

- In [Twilio Console](https://console.twilio.com), click **Upgrade** (or **Admin** → **Account billing** → **Upgrade account**).
- Production WhatsApp requires a paid/upgraded Twilio account.

### Step 2: Meta (Facebook) Business

- You need a **Meta Business** identity (business.facebook.com).
- If you don’t have one: create a **Meta Business Portfolio** during the process below.
- For higher limits and “Official Business” badge, complete **Meta Business Verification** (business.facebook.com → **Business Settings** → **Security Center**). This can take a few days or weeks.

### Step 3: Register your WhatsApp sender in Twilio

1. In Twilio Console go to **Messaging** → **Senders** → **WhatsApp Senders**:  
   [WhatsApp Senders](https://console.twilio.com/us1/develop/sms/senders/whatsapp-senders)
2. Click **Create new sender**.
3. **Choose the phone number:**
   - **Option A – Twilio number:** Buy a Twilio number (must be able to receive SMS or voice for OTP). This number will become your WhatsApp Business sender.
   - **Option B – Your own number (e.g. clinic/owner):** Use a number **not already on WhatsApp**. It must be able to receive SMS or voice for a verification code. If the clinic number is already on WhatsApp (personal or Business app), you must remove it from WhatsApp first, then use it here.
4. Click **Continue with Facebook** and complete the **Self Sign-up** in the pop-up:
   - Log in with Facebook.
   - Create or select a **Meta Business Portfolio**.
   - Create or select a **WhatsApp Business Account (WABA)**.
   - Set **display name** (e.g. “Dr Sonal Shah Cosmetica India”) – must follow [Meta’s display name guidelines](https://www.facebook.com/business/help/757569725593362).
   - Add your **phone number** and choose **SMS** or **Phone call** to receive the 6-digit OTP; enter the OTP.
   - Review and **Confirm** Twilio’s access.
5. When registration finishes, your new sender appears in **WhatsApp Senders**. Note the **phone number** (e.g. +91 XXXXX XXXXX).

### Step 4: Meta Business Verification (recommended for production)

- In [Meta Business Settings](https://business.facebook.com/settings/security) → **Security Center**, complete **Business Verification** (documents, address, etc.).
- Until verification is done, you may have lower messaging limits. Approval can take from a few days to a few weeks.

### Step 5: Message templates (if required)

- WhatsApp often requires **approved templates** for the first message to a user (business-initiated).
- In Twilio: **Messaging** → **Templates** (or Content Template Builder). Create templates for “Appointment confirmed” and “Appointment cancelled”, submit for approval.
- If Twilio/WhatsApp returns template-related errors when sending, you’ll need to use these templates in the Edge Function (send by template ID + variables instead of free-form `Body`). Approval is usually within 24 hours.

### Step 6: Use production number in your site

- Set the Edge Function secret to your **production** sender number (with country code, no spaces):
  ```bash
  supabase secrets set TWILIO_WHATSAPP_FROM=whatsapp:+91XXXXXXXXXX
  ```
- Redeploy the function if needed:
  ```bash
  supabase functions deploy send-whatsapp
  ```
- After that, all booking and cancellation messages go from your production WhatsApp number to any patient.

### Useful links

- [Twilio: Register WhatsApp senders (Self Sign-up)](https://www.twilio.com/docs/whatsapp/self-sign-up)
- [Twilio: WhatsApp production sender and templates (Help)](https://help.twilio.com/articles/360039246774-Twilio-WhatsApp-production-sender-and-template-creation)
- [Meta: Verify your business](https://www.facebook.com/business/help/2058515294227817)

---

## 6. Email vs WhatsApp

- **WhatsApp** is used for **confirmation** (after book) and **cancellation** (after admin delete), using the customer’s **phone** (WhatsApp number).
- **Email** (EmailJS) is optional and only for **cancellation** when you have the customer’s email. You can use both: WhatsApp + email on cancel.

If you don’t deploy the Edge Function or don’t set Twilio secrets, bookings and admin delete still work; the customer simply won’t get WhatsApp messages.
