// ManyChat -> Supabase bridge (minimal demo).
// Only tracks: phone, name, bot_stage, warmth.
// deno-lint-ignore-file no-explicit-any

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const rank = { cold: 0, warm: 1, hot: 2 } as const;
type Warmth = keyof typeof rank;

function digits(s: any): string | null {
  const d = String(s ?? "").replace(/\D/g, "");
  return d.length ? d : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const body: any = await req.json().catch(() => ({}));
  const cf = (body?.custom_fields && typeof body.custom_fields === "object") ? body.custom_fields : {};

  const phone = digits(body.whatsapp_phone ?? body.phone ?? cf.search_phone);
  if (!phone) return new Response(JSON.stringify({ ok: false, error: "no_phone" }), { headers: { ...cors, "content-type": "application/json" } });

  const full_name =
    [body.first_name, body.last_name].filter(Boolean).join(" ").trim() ||
    (body.name ? String(body.name).trim() : "") ||
    "ליד וואטסאפ";

  // Hardcoded demo mapping: 3 bot stages -> warmth.
  const stage = cf.bot_stage != null ? String(cf.bot_stage) : (body.bot_stage != null ? String(body.bot_stage) : null);
  const stageMap: Record<string, Warmth> = { welcome: "cold", appartments: "warm", apartments: "warm", u360: "hot" };
  const key = stage ? stage.toLowerCase().trim() : "";
  let warmth: Warmth = stageMap[key] ?? "cold";

  // Last free-text input from the user (ManyChat exposes it as `last_input_text`).
  const lastText =
    (body.last_input_text ?? cf.last_input_text ?? cf.last_user_input ?? null);
  const lastTextStr = lastText != null ? String(lastText).trim() : null;

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: existing } = await sb.from("leads").select("id, warmth, full_name").eq("phone", phone).maybeSingle();

  const merged: Warmth = existing
    ? (rank[warmth] > rank[(existing.warmth as Warmth) ?? "cold"] ? warmth : ((existing.warmth as Warmth) ?? "cold"))
    : warmth;

  let leadId = existing?.id as string | undefined;
  const now = new Date().toISOString();

  if (!leadId) {
    const { data: ins, error } = await sb.from("leads").insert({
      full_name, phone, source: "whatsapp", stage: "new",
      warmth: merged, bot_stage: stage, last_bot_event_at: now,
    }).select("id").single();
    if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500, headers: { ...cors, "content-type": "application/json" } });
    leadId = ins.id as string;
  } else {
    const patch: Record<string, unknown> = { warmth: merged, bot_stage: stage, last_bot_event_at: now };
    if ((!existing!.full_name || existing!.full_name === "ליד וואטסאפ") && full_name) patch.full_name = full_name;
    await sb.from("leads").update(patch).eq("id", leadId);
  }

  // Log stage progression + last text input.
  if (stage || lastTextStr) {
    await sb.from("lead_inquiries").insert({
      lead_id: leadId, source: "whatsapp",
      bot_stage: stage, bot_event: `warmth:${merged}`,
      message: lastTextStr,
    });
  }

  return new Response(JSON.stringify({ ok: true, lead_id: leadId, warmth: merged, bot_stage: stage }), {
    headers: { ...cors, "content-type": "application/json" },
  });
});