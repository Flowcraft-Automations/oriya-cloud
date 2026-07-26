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

  const { event, phone, template, status, tags, opted_in, reason } = body ?? {};

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

  return new Response(JSON.stringify({ ok: true, todo: "wire real ManyChat handlers" }), {
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
});