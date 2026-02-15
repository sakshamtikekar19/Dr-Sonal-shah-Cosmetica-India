// Supabase Edge Function: Delete bookings whose appointment date+time is in the past (IST).
// Run daily via pg_cron or Dashboard cron. No WhatsApp sent (appointment already happened).
// Deploy: supabase functions deploy cleanup-past-bookings
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

/** Normalize slot end time: 01:00/02:00 = 1–2 PM, 06:00–09:00 = 6–9 PM (24h). */
function to24h(timeStr: string): string {
  const m = (timeStr || "").trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return "23:59";
  let h = parseInt(m[1], 10);
  if (h >= 1 && h <= 9) h += 12; // 1–9 => 13–21 (PM)
  if (h === 24) h = 12; // 12:xx stays 12 (noon)
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

/** Slot format "10:00-10:30". Returns true if slot end (on preferred_date) in IST is <= now. */
function isPastBooking(row: { preferred_date: string; preferred_time: string }): boolean {
  const dateStr = (row.preferred_date || "").trim();
  const slot = (row.preferred_time || "").trim();
  const endPart = slot.includes("-") ? slot.split("-")[1]?.trim() || "23:59" : "23:59";
  const end24 = to24h(endPart);
  const endIst = `${dateStr}T${end24}:00+05:30`;
  const endMs = new Date(endIst).getTime();
  return endMs <= Date.now();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  // If CRON_SECRET is set, only allow requests that send it (e.g. cron job). Otherwise allow normal Supabase auth.
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const authHeader = req.headers.get("Authorization") ?? "";
    const xCron = req.headers.get("x-cron-secret") ?? "";
    if (authHeader !== `Bearer ${cronSecret}` && xCron !== cronSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server not configured" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: rows, error: selectError } = await supabase
      .from("bookings")
      .select("id, preferred_date, preferred_time");

    if (selectError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch bookings", detail: selectError.message }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const pastIds = (rows || []).filter((r) => isPastBooking(r)).map((r) => r.id);
    if (pastIds.length === 0) {
      return new Response(
        JSON.stringify({ deleted: 0, message: "No past bookings to delete" }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const { error: deleteError } = await supabase.from("bookings").delete().in("id", pastIds);
    if (deleteError) {
      return new Response(
        JSON.stringify({ error: "Failed to delete past bookings", detail: deleteError.message }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ deleted: pastIds.length, ids: pastIds }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
