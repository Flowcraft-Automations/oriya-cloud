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
const FALLBACK_OWNER_ID = Deno.env.get("ORYA_DEMO_OWNER_ID") ?? "f1a4c930-d248-42fa-8d3f-4c18ac6559b8";

const rank = { cold: 0, warm: 1, hot: 2 } as const;
type Warmth = keyof typeof rank;

function digits(s: any): string | null {
  const d = String(s ?? "").replace(/\D/g, "");
  return d.length ? d : null;
}

async function resolveOwnerId(sb: ReturnType<typeof createClient>): Promise<string> {
  const { data } = await sb.from("leads").select("owner_id").limit(1).maybeSingle();
  return data?.owner_id ?? FALLBACK_OWNER_ID;
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
  const owner_id = await resolveOwnerId(sb);

  // ManyChat subscriber id (used to deep-link into ManyChat chat)
  const manychat_subscriber_id: string | null =
    (body?.id != null ? String(body.id) :
      (body?.subscriber?.id != null ? String(body.subscriber.id) :
        (cf?.subscriber_id != null ? String(cf.subscriber_id) : null)));

  const { data: existing } = await sb.from("leads")
    .select("id, warmth, full_name, manychat_subscriber_id")
    .eq("phone", phone).maybeSingle();

  const merged: Warmth = existing
    ? (rank[warmth] > rank[(existing.warmth as Warmth) ?? "cold"] ? warmth : ((existing.warmth as Warmth) ?? "cold"))
    : warmth;

  let leadId = existing?.id as string | undefined;
  const now = new Date().toISOString();

  if (!leadId) {
    const { data: ins, error } = await sb.from("leads").insert({
      owner_id, full_name, phone, source: "whatsapp", stage: "new",
      warmth: merged, bot_stage: stage, last_bot_event_at: now,
      manychat_subscriber_id,
    }).select("id").single();
    if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500, headers: { ...cors, "content-type": "application/json" } });
    leadId = ins.id as string;
  } else {
    const patch: Record<string, unknown> = { warmth: merged, bot_stage: stage, last_bot_event_at: now };
    if ((!existing!.full_name || existing!.full_name === "ליד וואטסאפ") && full_name) patch.full_name = full_name;
    if (!existing!.manychat_subscriber_id && manychat_subscriber_id) patch.manychat_subscriber_id = manychat_subscriber_id;
    await sb.from("leads").update(patch).eq("id", leadId);
  }

  // One inquiry per bot session: "welcome" opens a new inquiry; later stages update the latest one.
  if (stage || lastTextStr) {
    const isWelcome = key === "welcome";
    const { data: latest } = await sb.from("lead_inquiries")
      .select("id, message, bot_stage")
      .eq("lead_id", leadId).eq("source", "whatsapp")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();

    if (!latest || isWelcome) {
      await sb.from("lead_inquiries").insert({
        owner_id, lead_id: leadId, source: "whatsapp",
        bot_stage: stage, bot_event: `warmth:${merged}`,
        message: lastTextStr,
      });
    } else {
      const prevMsg = (latest.message as string | null) ?? "";
      const line = [stage ? `[${stage}]` : null, lastTextStr].filter(Boolean).join(" ");
      const nextMsg = line ? (prevMsg ? `${prevMsg}\n${line}` : line) : prevMsg;
      await sb.from("lead_inquiries").update({
        bot_stage: stage ?? latest.bot_stage,
        bot_event: `warmth:${merged}`,
        message: nextMsg || null,
      }).eq("id", latest.id);
    }
  }

  return new Response(JSON.stringify({ ok: true, lead_id: leadId, warmth: merged, bot_stage: stage }), {
    headers: { ...cors, "content-type": "application/json" },
  });
});