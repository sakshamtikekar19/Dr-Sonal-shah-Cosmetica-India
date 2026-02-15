# Fix: Change Templates from Marketing to Utility

## Problem
Error 63049: "Meta chooses not to deliver this WhatsApp marketing message"
- Your templates are categorized as **"Marketing"**
- Appointment confirmations/cancellations should be **"Utility"** (transactional)

## Solution: Create New Utility Templates

### Step 1: Create Confirmation Template (Utility)

1. **Twilio Console** → **Messaging** → **Templates** → **Create Template**
2. **Template Details:**
   - **Name:** `appointment_confirmed_utility`
   - **Category:** Select **"UTILITY"** ⚠️ (NOT Marketing)
   - **Language:** English
3. **Content:**
   ```
   Hi {{1}}, your appointment at Dr Sonal Shah Cosmetica India is confirmed. Date: {{2}}, Time: {{3}}. Treatment: {{4}}. For any change, call or WhatsApp us.
   ```
4. **Variables:**
   - `{{1}}` = Customer name
   - `{{2}}` = Appointment date
   - `{{3}}` = Appointment time
   - `{{4}}` = Treatment/service
5. **Submit for approval** (usually 24-48 hours)

### Step 2: Create Cancellation Template (Utility)

1. **Twilio Console** → **Messaging** → **Templates** → **Create Template**
2. **Template Details:**
   - **Name:** `appointment_cancelled_utility`
   - **Category:** Select **"UTILITY"** ⚠️ (NOT Marketing)
   - **Language:** English
3. **Content:**
   ```
   Hi {{1}}, your appointment at Dr Sonal Shah Cosmetica India on {{2}} at {{3}} has been cancelled. To book again, visit our website or WhatsApp +91 98704 39934.
   ```
4. **Variables:**
   - `{{1}}` = Customer name
   - `{{2}}` = Appointment date
   - `{{3}}` = Appointment time
5. **Submit for approval** (usually 24-48 hours)

### Step 3: After Approval (you can do this one template at a time)

1. **Get Content SIDs:**
   - Go to **Templates** → Click each template → Copy **Content SID** (starts with `HX`)

2. **Update Supabase Secrets:**
   - Go to **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**
   - **Cancel approved first?** Set only:
     - `TWILIO_WHATSAPP_TEMPLATE_CANCEL` = cancel template Content SID  
     Cancellation WhatsApp will work; confirmation will be skipped until the confirm template is approved.
   - **Confirm approved later?** Add:
     - `TWILIO_WHATSAPP_TEMPLATE_CONFIRM` = confirmation template Content SID  
   No code or redeploy needed when only adding/updating these secrets.

3. **Redeploy Function (only if you changed code):**
   ```bash
   supabase functions deploy send-whatsapp
   ```
   Or via Supabase Dashboard → Edge Functions → `send-whatsapp` → Redeploy

### Step 4: Test

1. Make a test booking
2. Check Twilio Console → Monitor → Logs
3. Message should deliver successfully ✅

## Why Utility Category?

- **Utility** = Transactional messages (appointments, orders, confirmations)
- **Marketing** = Promotional messages (offers, ads, newsletters)
- Meta blocks marketing messages more strictly
- Utility messages have better delivery rates for transactional content

## Note

⚠️ **You cannot change template category after creation.** You must create new templates with "UTILITY" category.
