// Supabase Edge Function: Let customers cancel their own booking by phone + date + time.
// Uses service role to delete; sends WhatsApp cancellation via send-whatsapp.
// Deploy: supabase functions deploy cancel-booking
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (for delete + invoke send-whatsapp)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function normalizePhone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length >= 11) return digits;
  if (digits.length === 10) return "91" + digits;
  return digits;
}

serve(async (req) => {
  // Handle CORS preflight - must return early and not require auth
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200, 
      headers: CORS_HEADERS 
    });
  }
  
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server not configured" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let body: { phone?: string; preferred_date?: string; preferred_time?: string; name?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const phoneRaw = (body.phone ?? "").trim();
    const preferred_date = (body.preferred_date ?? "").trim();
    const preferred_time = (body.preferred_time ?? "").trim();

    if (!phoneRaw || !preferred_date || !preferred_time) {
      return new Response(
        JSON.stringify({ error: "Phone, date and time are required" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const phoneNorm = normalizePhone(phoneRaw);
    if (phoneNorm.length < 10) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Find booking(s): match normalized phone (e.g. 919870439934) or digits-only as stored
    const { data: rows, error: fetchError } = await supabase
      .from("bookings")
      .select("id, name, phone, preferred_date, preferred_time")
      .eq("preferred_date", preferred_date)
      .eq("preferred_time", preferred_time);

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: "Could not find booking", detail: fetchError.message }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const match = (rows ?? []).filter((r) => {
      const rNorm = normalizePhone(r.phone ?? "");
      return rNorm === phoneNorm || r.phone === phoneRaw;
    });

    if (match.length === 0) {
      return new Response(
        JSON.stringify({ error: "No appointment found with this phone number, date and time. Please check details or contact us on WhatsApp." }),
        { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }
    if (match.length > 1) {
      return new Response(
        JSON.stringify({ error: "Multiple appointments match. Please contact us on WhatsApp to cancel." }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const booking = match[0];
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const functionsUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/send-whatsapp`;

    // Send WhatsApp cancellation (fire-and-forget)
    try {
      await fetch(functionsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${anonKey || serviceRoleKey}`,
        },
        body: JSON.stringify({
          type: "cancel",
          phone: booking.phone,
          name: booking.name,
          preferred_date: booking.preferred_date,
          preferred_time: booking.preferred_time,
        }),
      });
    } catch (_) {
      // Still proceed to delete
    }

    const { error: deleteError } = await supabase
      .from("bookings")
      .delete()
      .eq("id", booking.id);

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: "Could not cancel appointment", detail: deleteError.message }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Your appointment has been cancelled. You will receive a WhatsApp confirmation shortly.",
      }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Something went wrong", detail: String(e) }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
