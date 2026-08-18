// Beds24 -> Supabase inbound booking webhook (deployed with verify_jwt = false;
// authenticated by the ?secret= query param instead).
// Contract: log the raw payload FIRST, then process; processing failures are recorded
// on the log row and still answered with 200 so Beds24 does not retry-storm.
// deno-lint-ignore-file no-explicit-any

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { mapBeds24Booking } from "../_shared/beds24.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FALLBACK_OWNER_ID = Deno.env.get("ORYA_DEMO_OWNER_ID") ?? "f1a4c930-d248-42fa-8d3f-4c18ac6559b8";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function resolveOwnerId(sb: any): Promise<string> {
  const { data } = await sb.from("leads").select("owner_id").limit(1).maybeSingle();
  return data?.owner_id ?? FALLBACK_OWNER_ID;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const expected = Deno.env.get("BEDS24_WEBHOOK_SECRET");
  const provided = new URL(req.url).searchParams.get("secret");
  if (!expected || provided !== expected) return json({ ok: false, error: "forbidden" }, 403);

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const payload = await req.json().catch(() => null);

  const { data: logRow, error: logError } = await sb
    .from("integration_sync_log")
    .insert({ provider: "beds24", direction: "inbound", event: "booking_webhook", payload })
    .select("id")
    .single();
  if (logError) {
    console.error("sync log insert failed", logError.message);
    return json({ ok: false, error: "log_insert_failed" }, 500);
  }

  const fail = async (error: string) => {
    console.error("beds24-webhook", error, JSON.stringify(payload));
    await sb.from("integration_sync_log").update({ status: "error", error }).eq("id", logRow.id);
    return json({ ok: false, error });
  };

  try {
    const booking = payload?.booking ?? payload;
    const bookingId = Number(booking?.id);
    const roomId = Number(booking?.roomId);
    if (!Number.isFinite(bookingId) || !bookingId) return await fail("missing_booking_id");
    if (!Number.isFinite(roomId) || !roomId) return await fail("missing_room_id");

    const { data: unit } = await sb
      .from("units")
      .select("id, owner_id")
      .eq("beds24_room_id", roomId)
      .maybeSingle();
    if (!unit) return await fail(`unknown_room:${roomId}`);

    const mapped = mapBeds24Booking(booking);
    const guestName =
      mapped.guest_name ??
      [booking?.firstName, booking?.lastName].filter(Boolean).join(" ").trim();

    const fields: Record<string, unknown> = {
      unit_id: unit.id,
      guest_name: guestName || "אורח Beds24",
      status: mapped.status,
      channel: mapped.channel,
      beds24_status: String(booking?.status ?? ""),
      sync_source: "beds24",
      last_synced_at: new Date().toISOString(),
    };
    if (booking?.arrival) fields.check_in = booking.arrival;
    if (booking?.departure) fields.check_out = booking.departure;
    if (booking?.phone != null) fields.phone = String(booking.phone);
    if (booking?.numAdult != null) fields.adults = Number(booking.numAdult);
    if (booking?.numChild != null) fields.children = Number(booking.numChild);
    if (booking?.price != null) fields.total_amount = Number(booking.price);

    // PostgREST upsert cannot target the PARTIAL unique index on beds24_booking_id,
    // so this is a select-then-write; a 23505 race means another writer inserted the
    // same booking first, in which case we retry as an update.
    const { data: existing } = await sb
      .from("reservations")
      .select("id")
      .eq("beds24_booking_id", bookingId)
      .maybeSingle();

    if (existing) {
      const { error } = await sb.from("reservations").update(fields).eq("id", existing.id);
      if (error) return await fail(`update_failed:${error.code ?? ""}:${error.message}`);
    } else {
      const owner_id = unit.owner_id ?? (await resolveOwnerId(sb));
      const { error } = await sb
        .from("reservations")
        .insert({ ...fields, owner_id, beds24_booking_id: bookingId });
      if (error?.code === "23505") {
        const { data: raced } = await sb
          .from("reservations")
          .select("id")
          .eq("beds24_booking_id", bookingId)
          .maybeSingle();
        if (!raced) return await fail(`insert_conflict_unresolved:${error.message}`);
        const { error: updError } = await sb.from("reservations").update(fields).eq("id", raced.id);
        if (updError) return await fail(`update_failed:${updError.code ?? ""}:${updError.message}`);
      } else if (error) {
        return await fail(`insert_failed:${error.code ?? ""}:${error.message}`);
      }
    }

    await sb.from("integration_sync_log").update({ status: "processed" }).eq("id", logRow.id);
    console.log(JSON.stringify({ event: "beds24_booking_synced", bookingId, roomId, status: mapped.status }));
    return json({ ok: true, booking_id: bookingId });
  } catch (e) {
    return await fail(`unhandled:${e instanceof Error ? e.message : String(e)}`);
  }
});
