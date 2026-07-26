// ManyChat -> Supabase bridge.
// Payload shape (observed): flat subscriber object with `whatsapp_phone`,
// `name`/`first_name`/`last_name`, and `custom_fields{...}` holding bot state.
// deno-lint-ignore-file no-explicit-any

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-manychat-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SECRET = Deno.env.get("MANYCHAT_WEBHOOK_SECRET") ?? "";

function digits(s: string | null | undefined): string | null {
  if (!s) return null;
  const d = String(s).replace(/\D/g, "");
  return d.length ? d : null;
}

function pickName(p: any): string {
  const fn = (p.first_name ?? "").toString().trim();
  const ln = (p.last_name ?? "").toString().trim();
  const nm = (p.name ?? "").toString().trim();
  const composed = [fn, ln].filter(Boolean).join(" ").trim();
  return composed || nm || "ליד וואטסאפ";
}

function truthy(v: any): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  return true;
}

function deriveWarmth(cf: Record<string, any>): "cold" | "warm" | "hot" {
  const hotFields = [
    "order_datetime",
    "existing_order_request",
    "urgent_request",
    "urgent_request_content",
    "call_request",
    "url_meeting",
    "clicked_url",
    "order_content",
    "textual_order",
    "recording_order",
    "image_order",
  ];
  const warmFields = [
    "service_category",
    "service_requested",
    "product",
    "product_category",
    "request_type",
    "campaign_name",
    "campaign",
    "initial_request",
    "general_request_content",
  ];
  if (hotFields.some((k) => truthy(cf[k]))) return "hot";
  if (warmFields.some((k) => truthy(cf[k]))) return "warm";
  return "cold";
}

const warmthRank = { cold: 0, warm: 1, hot: 2 } as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  if (SECRET) {
    const sig = req.headers.get("x-manychat-signature") ?? "";
    if (sig !== SECRET) return new Response("Unauthorized", { status: 401 });
  }

  const rawText = await req.text();
  let body: any;
  try {
    body = JSON.parse(rawText);
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const cf: Record<string, any> = (body?.custom_fields && typeof body.custom_fields === "object")
    ? body.custom_fields
    : {};

  const phone = digits(body.whatsapp_phone ?? body.phone ?? cf.search_phone ?? cf.lead_phone_number);
  if (!phone) {
    console.warn("[manychat-webhook] no phone", { id: body?.id });
    return new Response(JSON.stringify({ ok: false, error: "no_phone" }), {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const full_name = pickName(body);
  const bot_stage_key = cf.bot_stage != null ? String(cf.bot_stage) : null;
  const bot_stage_content_field = cf.bot_stage_content ? String(cf.bot_stage_content) : null;
  const latest_message =
    (bot_stage_content_field && cf[bot_stage_content_field] != null
      ? String(cf[bot_stage_content_field])
      : null) ??
    (body.last_input_text ? String(body.last_input_text) : null);

  const newWarmth = deriveWarmth(cf);

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // find existing lead by phone
  const { data: existing, error: findErr } = await sb
    .from("leads")
    .select("id, warmth, bot_stage, full_name, source, stage")
    .eq("phone", phone)
    .maybeSingle();
  if (findErr) {
    console.error("[manychat-webhook] find lead failed", findErr);
    return new Response(JSON.stringify({ ok: false, error: findErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const mergedWarmth: "cold" | "warm" | "hot" = existing
    ? (warmthRank[newWarmth] > warmthRank[(existing.warmth as "cold" | "warm" | "hot") ?? "cold"]
        ? newWarmth
        : ((existing.warmth as "cold" | "warm" | "hot") ?? "cold"))
    : newWarmth;

  let leadId = existing?.id as string | undefined;

  if (!leadId) {
    const { data: ins, error: insErr } = await sb
      .from("leads")
      .insert({
        full_name,
        phone,
        source: "whatsapp",
        stage: "new",
        warmth: mergedWarmth,
        bot_stage: bot_stage_key,
        last_bot_event_at: new Date().toISOString(),
        interest: cf.service_category ?? cf.product ?? cf.request_type ?? null,
        notes: cf.general_request_content ?? null,
      })
      .select("id")
      .single();
    if (insErr) {
      console.error("[manychat-webhook] insert lead failed", insErr);
      return new Response(JSON.stringify({ ok: false, error: insErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }
    leadId = ins.id as string;
  } else {
    const patch: Record<string, unknown> = {
      warmth: mergedWarmth,
      bot_stage: bot_stage_key,
      last_bot_event_at: new Date().toISOString(),
    };
    if ((!existing.full_name || existing.full_name === "ליד וואטסאפ") && full_name) {
      patch.full_name = full_name;
    }
    const { error: updErr } = await sb.from("leads").update(patch).eq("id", leadId);
    if (updErr) console.error("[manychat-webhook] update lead failed", updErr);
  }

  // record this bot event as an inquiry
  const { error: inqErr } = await sb.from("lead_inquiries").insert({
    lead_id: leadId,
    source: "whatsapp",
    bot_stage: bot_stage_key,
    bot_event: bot_stage_content_field,
    message: latest_message,
    payload: body,
  });
  if (inqErr) console.error("[manychat-webhook] insert inquiry failed", inqErr);

  return new Response(
    JSON.stringify({
      ok: true,
      lead_id: leadId,
      warmth: mergedWarmth,
      bot_stage: bot_stage_key,
    }),
    { headers: { ...corsHeaders, "content-type": "application/json" } },
  );
});