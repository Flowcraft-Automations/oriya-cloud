// App -> Beds24 outbound push (deployed with verify_jwt = true).
// Beds24 is the source of truth for mapped units: the remote booking is created first,
// and the local reservation row is written only after Beds24 accepts. A local overlap
// (exclusion constraint 23P01) triggers a compensating cancel on Beds24 and a 409.
// deno-lint-ignore-file no-explicit-any

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { beds24Fetch } from "../_shared/beds24.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function splitName(full: string): { firstName: string; lastName: string } {
  const trimmed = (full ?? "").trim();
  const spaceIdx = trimmed.indexOf(" ");
  if (spaceIdx === -1) return { firstName: trimmed, lastName: "" };
  return { firstName: trimmed.slice(0, spaceIdx), lastName: trimmed.slice(spaceIdx + 1) };
}

async function logOutbound(sb: any, event: string, payload: unknown, status: string, error?: string) {
  await sb.from("integration_sync_log").insert({
    provider: "beds24",
    direction: "outbound",
    event,
    payload,
    status,
    error: error ?? null,
  });
}

// POST /bookings takes an array; a cancel is a status update on an existing booking id.
async function cancelBeds24Booking(sb: any, bookingId: number): Promise<{ ok: boolean; raw: any }> {
  const res = await beds24Fetch(sb, "/bookings", {
    method: "POST",
    body: JSON.stringify([{ id: bookingId, status: "cancelled" }]),
  });
  const raw = await res.json().catch(() => null);
  return { ok: res.ok, raw };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: userData, error: userError } = await sb.auth.getUser(jwt);
  const user = userData?.user;
  if (userError || !user) return json({ ok: false, error: "unauthorized" }, 401);

  const body = await req.json().catch(() => null);
  const action = body?.action;

  try {
    if (action === "create" || action === "block") {
      const { unit_id, check_in, check_out } = body ?? {};
      if (!unit_id || !check_in || !check_out) return json({ ok: false, error: "missing_fields" }, 400);

      const { data: unit } = await sb
        .from("units")
        .select("id, owner_id, beds24_room_id")
        .eq("id", unit_id)
        .eq("owner_id", user.id)
        .maybeSingle();
      if (!unit) return json({ ok: false, error: "unit_not_found" }, 404);
      if (!unit.beds24_room_id) return json({ ok: false, error: "unit_not_mapped" }, 400);

      const isBlock = action === "block";
      const guestName = isBlock ? (body.title ?? "חסימת תחזוקה") : (body.guest?.name ?? "");
      const { firstName, lastName } = splitName(guestName);

      const beds24Booking: Record<string, unknown> = {
        roomId: unit.beds24_room_id,
        arrival: check_in,
        departure: check_out,
        status: isBlock ? "black" : "confirmed",
        firstName,
        lastName,
      };
      if (!isBlock) {
        if (body.guest?.phone) beds24Booking.phone = body.guest.phone;
        if (body.guest?.email) beds24Booking.email = body.guest.email;
      }
      if (body.notes) beds24Booking.notes = body.notes;

      const res = await beds24Fetch(sb, "/bookings", {
        method: "POST",
        body: JSON.stringify([beds24Booking]),
      });
      const raw = await res.json().catch(() => null);
      const bookingId = Number(raw?.[0]?.new?.id ?? raw?.[0]?.modified?.id);

      if (!res.ok || !Number.isFinite(bookingId) || !bookingId) {
        console.error("beds24 create rejected", res.status, JSON.stringify(raw));
        await logOutbound(sb, action, { request: beds24Booking, response: raw }, "error", `beds24_rejected:${res.status}`);
        return json({ ok: false, error: "beds24_rejected", detail: raw }, 502);
      }
      await logOutbound(sb, action, { request: beds24Booking, response: raw }, "sent");

      const localRow = {
        owner_id: user.id,
        unit_id: unit.id,
        guest_name: guestName || "חסימה",
        phone: body.guest?.phone ?? null,
        channel: isBlock ? "block" : (body.channel ?? "direct"),
        status: "confirmed",
        check_in,
        check_out,
        notes: body.notes ?? null,
        beds24_booking_id: bookingId,
        beds24_status: isBlock ? "black" : "confirmed",
        sync_source: "app",
        last_synced_at: new Date().toISOString(),
      };
      const { data: inserted, error: insError } = await sb
        .from("reservations")
        .insert(localRow)
        .select("id")
        .single();

      if (insError?.code === "23505") {
        // Echo race: Beds24's webhook already inserted this booking — adopt that row.
        const { data: echoed } = await sb
          .from("reservations")
          .select("id")
          .eq("beds24_booking_id", bookingId)
          .maybeSingle();
        if (echoed) {
          await sb
            .from("reservations")
            .update({ sync_source: "app", notes: localRow.notes, phone: localRow.phone })
            .eq("id", echoed.id);
          return json({ ok: true, reservation_id: echoed.id, beds24_booking_id: bookingId, adopted: true });
        }
        await logOutbound(sb, action, { bookingId }, "error", "echo_race_unresolved");
        return json({ ok: false, error: "echo_race_unresolved" }, 500);
      }

      if (insError?.code === "23P01") {
        // Local overlap: compensate by cancelling the booking we just created remotely.
        const cancel = await cancelBeds24Booking(sb, bookingId);
        await logOutbound(
          sb,
          `${action}_compensating_cancel`,
          { bookingId, cancelResponse: cancel.raw },
          cancel.ok ? "sent" : "error",
          cancel.ok ? "local_overlap" : "local_overlap_and_remote_cancel_failed",
        );
        return json({ ok: false, error: "overlap" }, 409);
      }

      if (insError) {
        await logOutbound(sb, action, { bookingId }, "error", `local_insert_failed:${insError.code ?? ""}:${insError.message}`);
        return json({ ok: false, error: insError.message }, 500);
      }

      return json({ ok: true, reservation_id: inserted.id, beds24_booking_id: bookingId });
    }

    if (action === "cancel") {
      const { reservation_id } = body ?? {};
      if (!reservation_id) return json({ ok: false, error: "missing_fields" }, 400);

      const { data: reservation } = await sb
        .from("reservations")
        .select("id, beds24_booking_id")
        .eq("id", reservation_id)
        .eq("owner_id", user.id)
        .maybeSingle();
      if (!reservation) return json({ ok: false, error: "reservation_not_found" }, 404);

      if (reservation.beds24_booking_id) {
        const cancel = await cancelBeds24Booking(sb, reservation.beds24_booking_id);
        await logOutbound(
          sb,
          "cancel",
          { reservation_id, beds24_booking_id: reservation.beds24_booking_id, response: cancel.raw },
          cancel.ok ? "sent" : "error",
          cancel.ok ? undefined : "beds24_cancel_failed",
        );
        if (!cancel.ok) return json({ ok: false, error: "beds24_rejected", detail: cancel.raw }, 502);
      }

      const { error } = await sb
        .from("reservations")
        .update({
          status: "cancelled",
          beds24_status: reservation.beds24_booking_id ? "cancelled" : undefined,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", reservation.id);
      if (error) return json({ ok: false, error: error.message }, 500);

      return json({ ok: true, reservation_id: reservation.id });
    }

    return json({ ok: false, error: "unknown_action" }, 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("beds24-push unhandled", msg);
    await logOutbound(sb, String(action ?? "unknown"), body, "error", msg);
    return json({ ok: false, error: msg }, 500);
  }
});
