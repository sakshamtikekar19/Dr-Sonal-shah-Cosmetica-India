// Supabase Edge Function: send WhatsApp via Twilio (booking confirmation or cancellation)
// Set secrets: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM (e.g. whatsapp:+14155238886 for sandbox)
// Deploy as: send-whatsapp (so the site can call /functions/v1/send-whatsapp from any origin)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CLINIC_NAME = "Dr Sonal Shah Cosmetica India";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, x-client-version, prefer",
};

function normalizePhone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length === 10 && !digits.startsWith("91")) return "91" + digits;
  if (digits.length >= 10) return digits.startsWith("91") ? digits : "91" + digits;
  return digits;
}

function getMessage(
  type: "confirm" | "cancel",
  name: string,
  preferred_date: string,
  preferred_time: string,
  service?: string
): string {
  const namePart = name ? ` ${name}` : "";
  if (type === "confirm") {
    return (
      `Hi${namePart}, your appointment at ${CLINIC_NAME} is confirmed. ` +
      `Date: ${preferred_date}, Time: ${preferred_time}.` +
      (service ? ` Treatment: ${service}.` : "") +
      ` For any change, call or WhatsApp us. – ${CLINIC_NAME}`
    );
  }
  return (
    `Hi${namePart}, your appointment at ${CLINIC_NAME} on ${preferred_date} at ${preferred_time} has been cancelled. ` +
    `To book again, visit our website or WhatsApp +91 98704 39934. – ${CLINIC_NAME}`
  );
}

serve(async (req) => {
  try {
    // Preflight: must return 200 with CORS so browser allows the POST from GitHub Pages / any origin
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 200, headers: CORS_HEADERS });
    }
    
    // Note: Supabase Edge Functions require Authorization header by default.
    // The frontend (supabase.functions.invoke) automatically adds the anon key.
    // If testing directly, add: Authorization: Bearer YOUR_ANON_KEY
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
    }

  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_WHATSAPP_FROM"); // e.g. whatsapp:+14155238886

  if (!accountSid || !authToken || !fromNumber) {
    return new Response(
      JSON.stringify({ 
        error: "WhatsApp not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM in Supabase Edge Function secrets."
      }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  let body: { type?: string; phone?: string; name?: string; preferred_date?: string; preferred_time?: string; service?: string };
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON body", detail: String(e) }), { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  }

  const type = body.type === "cancel" ? "cancel" : "confirm";
  const phoneRaw = body.phone || "";
  const phone = normalizePhone(phoneRaw);
  if (!phone || phone.length < 10) {
    return new Response(JSON.stringify({ 
      error: "Missing or invalid phone number", 
      received: phoneRaw,
      normalized: phone,
      body_received: body 
    }), { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  }

  const toWhatsApp = "whatsapp:+".concat(phone.startsWith("+") ? phone.slice(1) : phone);
  const name = (body.name || "").trim();
  const preferred_date = body.preferred_date || "";
  const preferred_time = body.preferred_time || "";
  const service = body.service || "";
  const messageBody = getMessage(type, name, preferred_date, preferred_time, service);

  const form = new URLSearchParams();
  form.set("From", fromNumber);
  form.set("To", toWhatsApp);
  form.set("Body", messageBody);

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const basicAuth = btoa(`${accountSid}:${authToken}`);
  
  const res = await fetch(twilioUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: form.toString(),
  });

  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    return new Response(
      JSON.stringify({ 
        error: "Twilio error", 
        detail: data.message || data.error_message || res.statusText,
        twilioCode: data.code
      }),
      { status: res.status >= 400 && res.status < 500 ? res.status : 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
  return new Response(JSON.stringify({ ok: true, sid: data.sid }), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
  } catch (e) {
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      detail: String(e),
      stack: e instanceof Error ? e.stack : undefined
    }), { 
      status: 500, 
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" } 
    });
  }
});
