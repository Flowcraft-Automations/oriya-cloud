// INSPECTION MODE — logs raw ManyChat payload so we can map fields.
// After we see one real payload we swap the handler back to writing leads.
// deno-lint-ignore-file no-explicit-any

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-manychat-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => (headers[k] = v));

  const rawText = await req.text();
  console.info("[manychat-webhook] HEADERS", JSON.stringify(headers));
  console.info("[manychat-webhook] RAW_BODY", rawText);

  let parsed: any = null;
  try {
    parsed = JSON.parse(rawText);
    console.info("[manychat-webhook] TOP_KEYS", JSON.stringify(Object.keys(parsed ?? {})));
    for (const k of ["subscriber", "contact", "custom_fields", "data", "user", "fields"]) {
      if (parsed && parsed[k] && typeof parsed[k] === "object") {
        console.info(
          `[manychat-webhook] ${k.toUpperCase()}_KEYS`,
          JSON.stringify(Object.keys(parsed[k])),
        );
        console.info(`[manychat-webhook] ${k.toUpperCase()}_DUMP`, JSON.stringify(parsed[k]));
      }
    }
  } catch (e) {
    console.warn("[manychat-webhook] JSON parse failed:", (e as Error).message);
  }

  return new Response(JSON.stringify({ ok: true, received: true }), {
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
});