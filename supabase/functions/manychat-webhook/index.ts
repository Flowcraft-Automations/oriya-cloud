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

type FieldBag = Record<string, unknown>;

function digits(s: any): string | null {
  const d = String(s ?? "").replace(/\D/g, "");
  return d.length ? d : null;
}

function normalizeWarmth(value: unknown): Warmth {
  const raw = String(value ?? "").toLowerCase().trim();
  if (raw === "hot" || raw === "חם") return "hot";
  if (raw === "warm" || raw === "חמים") return "warm";
  return "cold";
}

function normalizeStage(value: unknown): { stage: string; warmth: Warmth } | null {
  const raw = String(value ?? "").toLowerCase().trim();
  if (!raw) return null;
  const compact = raw.replace(/[\s_\-\/]+/g, "");
  if (compact.includes("u360") || compact.includes("360")) return { stage: "u360", warmth: "hot" };
  if (compact.includes("appartments") || compact.includes("apartments") || compact.includes("apartment") || raw.includes("דיר")) {
    return { stage: "appartments", warmth: "warm" };
  }
  if (compact.includes("welcome") || raw.includes("ברוכ") || raw.includes("ברוך")) return { stage: "welcome", warmth: "cold" };
  return null;
}

function collectCustomFields(value: unknown, bag: FieldBag = {}): FieldBag {
  if (!value) return bag;
  if (Array.isArray(value)) {
    for (const item of value) {
      if (!item || typeof item !== "object") continue;
      const record = item as FieldBag;
      const key = record.name ?? record.key ?? record.field_name ?? record.title;
      const val = record.value ?? record.field_value ?? record.answer ?? record.text;
      if (key != null) bag[String(key).toLowerCase().trim()] = val;
    }
    return bag;
  }
  if (typeof value === "object") {
    for (const [key, val] of Object.entries(value as FieldBag)) bag[key.toLowerCase().trim()] = val;
  }
  return bag;
}

function field(bag: FieldBag, names: string[]): unknown {
  for (const name of names) {
    const direct = bag[name.toLowerCase()];
    if (direct != null && String(direct).trim() !== "") return direct;
  }
  return null;
}

function firstNestedValue(value: unknown, keyMatchers: RegExp[], depth = 0): unknown {
  if (!value || depth > 4 || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstNestedValue(item, keyMatchers, depth + 1);
      if (found != null && String(found).trim() !== "") return found;
    }
    return null;
  }
  for (const [key, val] of Object.entries(value as FieldBag)) {
    if (keyMatchers.some((matcher) => matcher.test(key)) && val != null && String(val).trim() !== "") return val;
  }
  for (const val of Object.values(value as FieldBag)) {
    const found = firstNestedValue(val, keyMatchers, depth + 1);
    if (found != null && String(found).trim() !== "") return found;
  }
  return null;
}

function resolveStage(body: any, cf: FieldBag): { stage: string | null; warmth: Warmth } {
  const candidates = [
    field(cf, ["bot_stage", "stage", "manychat_stage", "lead_stage", "flow_stage"]),
    body.bot_stage,
    body.stage,
    body.event,
    body.action,
    body.trigger,
    body.last_button_text,
    body.last_input_text,
    field(cf, ["last_input_text", "last_user_input", "last_button_text"]),
    firstNestedValue(body, [/bot.*stage/i, /^stage$/i, /manychat.*stage/i, /last.*input/i, /button.*text/i]),
  ];

  let best: { stage: string; warmth: Warmth } | null = null;
  for (const candidate of candidates) {
    const mapped = normalizeStage(candidate);
    if (!mapped) continue;
    if (!best || rank[mapped.warmth] > rank[best.warmth]) best = mapped;
  }
  return best ?? { stage: null, warmth: "cold" };
}

async function resolveOwnerId(sb: ReturnType<typeof createClient>): Promise<string> {
  const { data } = await sb.from("leads").select("owner_id").limit(1).maybeSingle();
  return data?.owner_id ?? FALLBACK_OWNER_ID;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const body: any = await req.json().catch(() => ({}));
  const cf = collectCustomFields(body?.custom_fields);
  collectCustomFields(body?.subscriber?.custom_fields, cf);
  collectCustomFields(body?.contact?.custom_fields, cf);

  const phone = digits(
    body.whatsapp_phone ??
    body.phone ??
    body?.subscriber?.whatsapp_phone ??
    body?.subscriber?.phone ??
    body?.contact?.whatsapp_phone ??
    body?.contact?.phone ??
    field(cf, ["search_phone", "phone", "whatsapp_phone", "טלפון"]) ??
    firstNestedValue(body, [/whatsapp.*phone/i, /^phone$/i, /טלפון/])
  );
  if (!phone) return new Response(JSON.stringify({ ok: false, error: "no_phone" }), { headers: { ...cors, "content-type": "application/json" } });

  const full_name =
    [body.first_name, body.last_name].filter(Boolean).join(" ").trim() ||
    [body?.subscriber?.first_name, body?.subscriber?.last_name].filter(Boolean).join(" ").trim() ||
    (body.name ? String(body.name).trim() : "") ||
    (body?.subscriber?.name ? String(body.subscriber.name).trim() : "") ||
    "ליד וואטסאפ";

  // Hardcoded demo mapping: 3 bot stages -> warmth.
  const mappedStage = resolveStage(body, cf);
  const stage = mappedStage.stage;
  const key = stage ?? "";
  const warmth: Warmth = mappedStage.warmth;

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
        (body?.contact?.id != null ? String(body.contact.id) :
          (field(cf, ["subscriber_id", "manychat_subscriber_id", "contact_id"]) != null ? String(field(cf, ["subscriber_id", "manychat_subscriber_id", "contact_id"])) : null))));

  // Match by digits-only phone so "050-444-2233", "+972504442233" and "0504442233"
  // all resolve to the same existing lead instead of creating duplicates.
  const tail = phone.slice(-9); // last 9 digits (Israeli mobile without leading 0)
  let existing: any = null;
  if (manychat_subscriber_id) {
    const { data } = await sb.from("leads")
      .select("id, phone, warmth, full_name, manychat_subscriber_id")
      .eq("manychat_subscriber_id", manychat_subscriber_id).maybeSingle();
    existing = data ?? null;
  }
  if (!existing) {
    // Phones in the DB can contain dashes/spaces/prefixes. LIKE on the raw string
    // misses them, so pull recent leads with a phone and match on digits in JS.
    const { data: candidates } = await sb.from("leads")
      .select("id, phone, warmth, full_name, manychat_subscriber_id, created_at")
      .not("phone", "is", null)
      .order("created_at", { ascending: true })
      .limit(1000);
    existing = (candidates ?? []).find((c: any) => {
      const d = String(c.phone ?? "").replace(/\D/g, "");
      return d.length >= 8 && (d.endsWith(tail) || tail.endsWith(d.slice(-9)));
    }) ?? null;
  }

  const existingWarmth = normalizeWarmth(existing?.warmth);
  const merged: Warmth = existing
    ? (rank[warmth] > rank[existingWarmth] ? warmth : existingWarmth)
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
    const { error } = await sb.from("leads").update(patch).eq("id", leadId);
    if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500, headers: { ...cors, "content-type": "application/json" } });
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
        payload: body,
      });
    } else {
      const prevMsg = (latest.message as string | null) ?? "";
      const line = [stage ? `[${stage}]` : null, lastTextStr].filter(Boolean).join(" ");
      const nextMsg = line ? (prevMsg ? `${prevMsg}\n${line}` : line) : prevMsg;
      await sb.from("lead_inquiries").update({
        bot_stage: stage ?? latest.bot_stage,
        bot_event: `warmth:${merged}`,
        message: nextMsg || null,
        payload: body,
      }).eq("id", latest.id);
    }
  }

  console.log(JSON.stringify({ event: "manychat_mapped", lead_id: leadId, stage, warmth: merged, subscriber: Boolean(manychat_subscriber_id), phone_tail: tail }));

  return new Response(JSON.stringify({ ok: true, lead_id: leadId, warmth: merged, bot_stage: stage }), {
    headers: { ...cors, "content-type": "application/json" },
  });
});