# Verify WhatsApp Production Setup

## ✅ Step 1: Check Supabase Secret

1. Go to **Supabase Dashboard** → Your Project → **Project Settings** → **Edge Functions** → **Secrets**
2. Find `TWILIO_WHATSAPP_FROM`
3. **Should be:** `whatsapp:+15188559834`
4. If it's different (e.g., `whatsapp:+14155238886` which is Sandbox), update it to `whatsapp:+15188559834`

## ✅ Step 2: Check Function Logs

1. Go to **Supabase Dashboard** → **Edge Functions** → `send-whatsapp` → **Logs**
2. Make a test booking from your website
3. Look for log entry with:
   ```
   "fromNumberPrefix": "whatsapp:+1"
   ```
   or
   ```
   "from": "whatsapp:+15188559834"
   ```
4. If you see `whatsapp:+14155238886` (Sandbox), the secret wasn't updated correctly.

## ✅ Step 3: Test with Different Number

1. Ask someone else (or use a different phone) to book an appointment
2. They should receive WhatsApp confirmation from **+15188559834** (Dr Sonal Shah)
3. If they don't receive it, check:
   - Function logs for errors
   - Twilio Console → Monitor → Logs for delivery status
   - Make sure templates are approved (if using templates)

## ⚠️ Important: Message Templates

Production WhatsApp requires **approved message templates** for business-initiated messages.

### Check Templates in Twilio:
1. Go to **Twilio Console** → **Messaging** → **Templates** (or **Content Template Builder**)
2. You should have templates for:
   - **Appointment confirmation** (approved)
   - **Appointment cancellation** (approved)
3. If templates show "Under review" or "Rejected", messages won't send.

### If Templates Are Missing:
1. Create templates in Twilio Console
2. Get the **Content SID** (starts with `HX`)
3. Add to Supabase secrets:
   - `TWILIO_WHATSAPP_TEMPLATE_CONFIRM` = your confirmation template SID
   - `TWILIO_WHATSAPP_TEMPLATE_CANCEL` = your cancellation template SID
4. Redeploy function: `supabase functions deploy send-whatsapp`

## 🔍 Troubleshooting

### Messages not sending to customers:
- ✅ Check `TWILIO_WHATSAPP_FROM` is `whatsapp:+15188559834`
- ✅ Check templates are approved in Twilio
- ✅ Check function logs for errors
- ✅ Check Twilio Console → Monitor → Logs for delivery status

### Still using Sandbox number:
- The secret wasn't updated or function wasn't redeployed
- Update secret and wait a few minutes for it to propagate
