// Public webhook stub — ManyChat will POST delivery events + inbound messages here.
// TODO: verify signature using MANYCHAT_WEBHOOK_SECRET and process real payloads.
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-manychat-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("MANYCHAT_WEBHOOK_SECRET");
  const signature = req.headers.get("x-manychat-signature");
  if (secret && signature !== secret) {
    // Placeholder shared-secret check; real HMAC verification comes later.
    return new Response("invalid signature", { status: 401, headers: corsHeaders });
  }

  const body = await req.json().catch(() => ({} as any));
  console.info("[manychat-webhook] event:", body?.event, "phone:", body?.phone);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { event, phone: rawPhone, template, status, tags, opted_in, reason } = body ?? {};
  const phone = normalizePhone(rawPhone);

  if (event === "delivery" && phone && status) {
    const ts = new Date().toISOString();
    const patch: Record<string, unknown> = { status };
    if (status === "delivered") patch.delivered_at = ts;
    if (status === "read") patch.read_at = ts;
    if (status === "replied") patch.replied_at = ts;
    await supabase
      .from("messages_log")
      .update(patch)
      .eq("phone", phone)
      .eq("template_id", template ?? null)
      .order("created_at", { ascending: false })
      .limit(1);
  }

  if (event === "consent" && phone) {
    const { data: cust } = await supabase.from("customers").select("id").eq("phone", phone).maybeSingle();
    if (cust) {
      await supabase.from("contact_consent").upsert({
        customer_id: cust.id,
        opted_in: !!opted_in,
        reason: reason ?? null,
      });
    }
  }

  if (event === "tags" && phone && Array.isArray(tags)) {
    const { data: cust } = await supabase.from("customers").select("id").eq("phone", phone).maybeSingle();
    if (cust) {
      for (const tag of tags) {
        await supabase.from("contact_tags").upsert(
          { customer_id: cust.id, tag, source: "manychat" },
          { onConflict: "customer_id,tag" },
        );
      }
    }
  }

  if (event === "lead_stage" && phone) {
    const { full_name, stage: botStage, bot_event, warmth: warmthIn, fields } =
      body ?? {};
    const f = (fields ?? {}) as Record<string, any>;

    // Find existing lead by phone
    const { data: existing } = await supabase
      .from("leads")
      .select("id, stage, warmth, full_name")
      .eq("phone", phone)
      .maybeSingle();

    // Derive warmth
    const derived = deriveWarmth({ bot_event, fields: f });
    const nextWarmth = maxWarmth(
      existing?.warmth ?? "cold",
      warmthIn ?? derived,
    );

    let leadId = existing?.id as string | undefined;

    if (!leadId) {
      const { data: inserted, error } = await supabase
        .from("leads")
        .insert({
          full_name: full_name || f.name || "ליד וואטסאפ",
          phone,
          email: f.email ?? null,
          source: "whatsapp",
          stage: "new",
          bot_stage: botStage ?? null,
          warmth: nextWarmth,
          last_bot_event_at: new Date().toISOString(),
          interest: f.interest ?? null,
        })
        .select("id")
        .single();
      if (error) {
        console.error("[manychat-webhook] lead insert failed:", error);
        return new Response(JSON.stringify({ ok: false, error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "content-type": "application/json" },
        });
      }
      leadId = inserted!.id;
    } else {
      const patch: Record<string, unknown> = {
        bot_stage: botStage ?? null,
        warmth: nextWarmth,
        last_bot_event_at: new Date().toISOString(),
      };
      if (full_name && !existing?.full_name) patch.full_name = full_name;
      if (existing?.stage === "new" && bot_event) patch.stage = "contacted";
      if (bot_event === "handoff") patch.stage = "contacted";
      await supabase.from("leads").update(patch).eq("id", leadId);
    }

    // Resolve unit by name if provided
    let unitId: string | null = null;
    if (f.apt) {
      const { data: unit } = await supabase
        .from("units")
        .select("id, property_id")
        .ilike("name", `%${String(f.apt)}%`)
        .maybeSingle();
      if (unit) unitId = unit.id;
    }

    await supabase.from("lead_inquiries").insert({
      lead_id: leadId,
      source: "whatsapp",
      unit_id: unitId,
      check_in: f.check_in ?? null,
      check_out: f.check_out ?? null,
      guests: f.guests ? Number(f.guests) : null,
      message: f.message ?? null,
      guest_name: full_name || f.name || null,
      phone,
      email: f.email ?? null,
      form_name: "manychat_bot",
      bot_stage: botStage ?? null,
      bot_event: bot_event ?? null,
      payload: body,
    });

    return new Response(
      JSON.stringify({ ok: true, lead_id: leadId, warmth: nextWarmth, bot_stage: botStage }),
      { headers: { ...corsHeaders, "content-type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
});

function normalizePhone(input: unknown): string | null {
  if (!input) return null;
  const s = String(input).trim();
  const digits = s.replace(/[^\d]/g, "");
  if (!digits) return null;
  return s.startsWith("+") ? `+${digits}` : digits;
}

const WARMTH_RANK: Record<string, number> = { cold: 0, warm: 1, hot: 2 };
function maxWarmth(a: string, b: string): string {
  return (WARMTH_RANK[b] ?? 0) > (WARMTH_RANK[a] ?? 0) ? b : a;
}
function deriveWarmth({ bot_event, fields }: { bot_event?: string; fields: Record<string, any> }): string {
  const hot = ["handoff", "book_click", "site_click", "price_request", "dates_and_guests"];
  const warm = ["apt_selected", "audience_selected", "dates_selected", "guests_selected"];
  if (bot_event && hot.includes(bot_event)) return "hot";
  if (fields?.check_in && fields?.check_out && fields?.guests) return "hot";
  if (bot_event && warm.includes(bot_event)) return "warm";
  if (fields?.apt || fields?.audience) return "warm";
  return "cold";
}