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
  // Remove all non-digit characters
  const digits = (phone || "").replace(/\D/g, "");
  
  // If empty, return empty
  if (!digits) return "";
  
  // If already starts with country code (11+ digits), return as is
  if (digits.length >= 11) {
    return digits;
  }
  
  // If 10 digits, assume Indian number (91)
  if (digits.length === 10) {
    return "91" + digits;
  }
  
  // If less than 10 digits, return as is (will be validated later)
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
    console.log("Function invoked:", req.method, req.url);
    
    // Preflight: must return 200 with CORS so browser allows the POST from GitHub Pages / any origin
    if (req.method === "OPTIONS") {
      console.log("OPTIONS request - returning CORS headers");
      return new Response(null, { status: 200, headers: CORS_HEADERS });
    }
    
    // Note: Supabase Edge Functions require Authorization header by default.
    // The frontend (supabase.functions.invoke) automatically adds the anon key.
    // If testing directly, add: Authorization: Bearer YOUR_ANON_KEY
    if (req.method !== "POST") {
      console.log("Method not allowed:", req.method);
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
    }
    
    console.log("Processing POST request");

  console.log("Reading environment variables");
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")?.trim();
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")?.trim();
  const fromNumber = Deno.env.get("TWILIO_WHATSAPP_FROM")?.trim(); // e.g. whatsapp:+14155238886
  // WhatsApp message template SIDs (required for production - business-initiated messages)
  const templateConfirmSid = Deno.env.get("TWILIO_WHATSAPP_TEMPLATE_CONFIRM")?.trim(); // e.g. HXxxxxxxxxxxxxx
  const templateCancelSid = Deno.env.get("TWILIO_WHATSAPP_TEMPLATE_CANCEL")?.trim(); // e.g. HXxxxxxxxxxxxxx
  
  console.log("Template SIDs:", {
    confirm: templateConfirmSid ? templateConfirmSid.substring(0, 10) + "..." : "NOT SET",
    cancel: templateCancelSid ? templateCancelSid.substring(0, 10) + "..." : "NOT SET"
  });

  console.log("Secrets check:", {
    hasAccountSid: !!accountSid,
    accountSidPrefix: accountSid ? accountSid.substring(0, 2) : "missing",
    hasAuthToken: !!authToken,
    hasFromNumber: !!fromNumber,
    fromNumberPrefix: fromNumber ? fromNumber.substring(0, 10) : "missing"
  });

  if (!accountSid || !authToken || !fromNumber) {
    const errorResponse = {
      error: "WhatsApp not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM in Supabase Edge Function secrets.",
      missing: {
        accountSid: !accountSid,
        authToken: !authToken,
        fromNumber: !fromNumber
      }
    };
    console.error("Missing secrets:", errorResponse);
    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
  
  // Validate Account SID format (should start with AC)
  if (!accountSid.startsWith("AC")) {
    const errorResponse = {
      error: "Invalid TWILIO_ACCOUNT_SID format. Account SID should start with 'AC'.",
      receivedPrefix: accountSid.substring(0, 2)
    };
    console.error("Invalid Account SID format:", errorResponse);
    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
  
  console.log("Secrets validated, proceeding with request");

  console.log("Parsing request body");
  let body: { type?: string; phone?: string; name?: string; preferred_date?: string; preferred_time?: string; service?: string };
  try {
    body = await req.json();
    console.log("Request body parsed:", { type: body.type, phone: body.phone ? body.phone.substring(0, 5) + "..." : "missing", name: body.name });
  } catch (e) {
    console.error("Failed to parse JSON:", e);
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

  // Ensure fromNumber has whatsapp: prefix
  const fromWhatsApp = fromNumber.startsWith("whatsapp:") ? fromNumber : "whatsapp:" + fromNumber;
  
  console.log("WhatsApp numbers:", {
    from: fromWhatsApp,
    to: toWhatsApp,
    fromHasPrefix: fromNumber.startsWith("whatsapp:"),
    toHasPrefix: toWhatsApp.startsWith("whatsapp:")
  });

  const form = new URLSearchParams();
  form.set("From", fromWhatsApp);
  form.set("To", toWhatsApp);
  
  // Use template (required for production WhatsApp business-initiated messages)
  const templateSid = type === "confirm" ? templateConfirmSid : templateCancelSid;
  
  if (!templateSid) {
    // No template = error for production WhatsApp
    console.error("Template SID missing for type:", type);
    return new Response(
      JSON.stringify({ 
        error: "WhatsApp template not configured", 
        detail: `Set TWILIO_WHATSAPP_TEMPLATE_${type === "confirm" ? "CONFIRM" : "CANCEL"} in Supabase secrets`,
        type: type
      }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
  
  // Use WhatsApp message template
  console.log("Using WhatsApp template:", templateSid.substring(0, 10) + "...");
  form.set("ContentSid", templateSid);
  
  // Set template variables to match your templates:
  // Confirmation: {{1}} = name, {{2}} = date, {{3}} = time, {{4}} = service
  // Cancellation: {{1}} = name, {{2}} = date, {{3}} = time
  const contentVars: Record<string, string> = {};
  
  if (type === "confirm") {
    // Appointment confirmation template variables
    contentVars["1"] = name || "Customer";
    contentVars["2"] = preferred_date;
    contentVars["3"] = preferred_time;
    contentVars["4"] = service || "General consultation";
  } else {
    // Cancellation template variables
    contentVars["1"] = name || "Customer";
    contentVars["2"] = preferred_date;
    contentVars["3"] = preferred_time;
  }
  
  form.set("ContentVariables", JSON.stringify(contentVars));
  console.log("Template variables:", contentVars);

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
  
  console.log("Twilio API response:", {
    status: res.status,
    ok: res.ok,
    messageSid: data.sid,
    status: data.status,
    errorCode: data.code,
    errorMessage: data.message || data.error_message
  });
  
  if (!res.ok) {
    // Twilio 401 usually means wrong Account SID or Auth Token
    if (res.status === 401) {
      return new Response(
        JSON.stringify({ 
          error: "Twilio authentication failed", 
          detail: data.message || data.error_message || "Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in Supabase secrets",
          twilioCode: data.code,
          twilioStatus: res.status
        }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }
    
    // Error 63049: Meta declined to deliver WhatsApp message
    if (data.code === 63049) {
      const errorDetail = data.message || data.error_message || "Meta declined to deliver this WhatsApp message";
      console.error("Error 63049 - Meta delivery declined:", {
        to: toWhatsApp,
        from: fromWhatsApp,
        templateSid: templateSid,
        detail: errorDetail
      });
      return new Response(
        JSON.stringify({ 
          error: "WhatsApp message delivery declined by Meta", 
          detail: errorDetail + ". Common causes: Template not approved, recipient limits, or number format issue.",
          twilioCode: data.code,
          twilioStatus: res.status,
          troubleshooting: {
            checkTemplate: "Verify template is approved in Twilio Console → Messaging → Templates",
            checkNumber: `Verify recipient number format: ${toWhatsApp}`,
            checkLimits: "Recipient may have reached message limits - wait before retrying"
          }
        }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: "Twilio error", 
        detail: data.message || data.error_message || res.statusText,
        twilioCode: data.code,
        twilioStatus: res.status,
        fullResponse: data
      }),
      { status: res.status >= 400 && res.status < 500 ? res.status : 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
  
  // Check message status - even if Twilio accepted it, delivery might fail
  console.log("Twilio message accepted:", {
    sid: data.sid,
    status: data.status,
    to: data.to,
    from: data.from
  });
  
  return new Response(JSON.stringify({ 
    ok: true, 
    sid: data.sid,
    status: data.status,
    message: "Message sent to Twilio. Check Twilio Console → Monitor → Logs for delivery status."
  }), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
  } catch (e) {
    console.error("Unhandled error in function:", e);
    const errorDetail = e instanceof Error ? {
      message: e.message,
      stack: e.stack,
      name: e.name
    } : String(e);
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      detail: errorDetail
    }), { 
      status: 500, 
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" } 
    });
  }
});
