# Fix Error 63049: Meta Declined WhatsApp Delivery

Error **63049** means Meta (WhatsApp) declined to deliver your message. This is **NOT** a number format error.

## Common Causes & Solutions

### 1. ✅ **Template Not Approved** (Most Common)

**Check:**
- Go to **Twilio Console** → **Messaging** → **Templates** (or **Content Template Builder**)
- Find your confirmation and cancellation templates
- Status should be **"Approved"** (not "Under review" or "Rejected")

**Fix:**
- If templates are "Under review", wait 24-48 hours for approval
- If templates are "Rejected", fix the issues and resubmit
- Make sure template variables match what the function sends:
  - Confirmation: `{{1}}` = name, `{{2}}` = date, `{{3}}` = time, `{{4}}` = service
  - Cancellation: `{{1}}` = name, `{{2}}` = date, `{{3}}` = time

### 2. ✅ **Template SID Not Set in Supabase**

**Check:**
- Go to **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**
- Verify these secrets exist:
  - `TWILIO_WHATSAPP_TEMPLATE_CONFIRM` = your confirmation template Content SID (starts with `HX`)
  - `TWILIO_WHATSAPP_TEMPLATE_CANCEL` = your cancellation template Content SID (starts with `HX`)

**Fix:**
- Get Content SID from Twilio Console → Templates → Click template → Copy "Content SID"
- Add to Supabase secrets
- Redeploy function: `supabase functions deploy send-whatsapp`

### 3. ✅ **Recipient Message Limits**

Meta limits how many marketing messages a user can receive based on engagement.

**Fix:**
- Wait 24 hours before retrying
- Don't send multiple messages to the same number quickly
- Ensure recipients have opted in to receive messages

### 4. ✅ **Phone Number Format**

**Check Function Logs:**
- Go to **Supabase Dashboard** → **Edge Functions** → `send-whatsapp` → **Logs**
- Look for: `"to": "whatsapp:+91XXXXXXXXXX"`
- Should be in format: `whatsapp:+[country code][number]` (e.g., `whatsapp:+919870439934`)

**Fix:**
- Ensure phone numbers are entered correctly in booking form
- Function normalizes 10-digit Indian numbers to +91 format automatically

### 5. ✅ **WhatsApp Business Account Issues**

**Check:**
- Go to **Twilio Console** → **Messaging** → **Senders** → **WhatsApp Senders**
- Your sender (+15188559834) should show status **"Active"** or **"Verified"**

**Fix:**
- If status is "Pending" or "Failed", complete the verification process
- Ensure Meta Business Verification is complete (recommended)

## Quick Checklist

- [ ] Templates are **approved** in Twilio
- [ ] Template SIDs are set in Supabase secrets (`TWILIO_WHATSAPP_TEMPLATE_CONFIRM`, `TWILIO_WHATSAPP_TEMPLATE_CANCEL`)
- [ ] `TWILIO_WHATSAPP_FROM` is set to `whatsapp:+15188559834`
- [ ] WhatsApp sender status is **Active** in Twilio
- [ ] Phone numbers are in correct format (check function logs)
- [ ] Not sending too many messages to same recipient

## Test After Fixing

1. Make a test booking with a different phone number
2. Check function logs for any errors
3. Check Twilio Console → Monitor → Logs for delivery status
4. Recipient should receive message from +15188559834

## Still Not Working?

Check **Twilio Console** → **Monitor** → **Logs** for detailed error messages from Meta/WhatsApp.
