## Situation

Two POSTs from ManyChat did reach the webhook (2026-07-26 16:31:09 and 16:31:50), but our current `manychat-webhook` handler only logs two fields:

```
[manychat-webhook] event: undefined phone: null
```

That means ManyChat's payload uses different field names than we assumed (`event` / `phone` at the top level). The raw body wasn't captured, so I genuinely cannot see what fields ManyChat sent — the log line above is all that exists.

To map ManyChat → our `leads` / `lead_inquiries` schema correctly, I need to see one real payload first.

## Plan

### Step 1 — Capture the real payload (one deploy)

Update `supabase/functions/manychat-webhook/index.ts` so it:

- Reads the raw body as text, then parses JSON.
- Logs the full body: `console.log('[manychat-webhook] RAW', rawText)`.
- Logs top-level keys and a shallow dump of any `data` / `subscriber` / `contact` / `custom_fields` objects.
- Still returns `200 { ok: true }` so ManyChat marks the step successful.
- Does NOT yet write to the DB — pure inspection pass, so a wrong-shape payload can't create bad rows.

### Step 2 — You fire one test from ManyChat

Trigger the External Request node once from any test contact so a fresh payload lands in the logs.

### Step 3 — Read the logs and design the mapping

I pull the raw JSON from `edge_function_logs`, then in this same turn write the actual field mapping. Expected shape from ManyChat's External Request is roughly:

```text
{
  "subscriber": { "id", "first_name", "last_name", "phone", "whatsapp_phone", ... },
  "custom_fields": { <your bot fields: apt, check_in, check_out, guests, audience, stage, ...> },
  "tags": [...],
  "data": { ... }   // if you added a custom "data" JSON in the request body
}
```

Whatever it actually is, I'll map:

| Our column | Likely ManyChat source |
|---|---|
| `leads.phone` | `subscriber.whatsapp_phone` or `subscriber.phone` |
| `leads.full_name` | `subscriber.first_name` + `subscriber.last_name` |
| `leads.source` | constant `whatsapp` |
| `leads.bot_stage` | `custom_fields.stage` (or the ManyChat block name you send) |
| `leads.warmth` | derived from which fields are present (apt → warm, dates+guests → hot) |
| `lead_inquiries.unit_id` | lookup by `custom_fields.apt` (e.g. `U360`) |
| `lead_inquiries.check_in/out/guests` | matching `custom_fields.*` |
| `lead_inquiries.payload` | full raw body |

### Step 4 — Rewrite the handler with the confirmed mapping

Replace the inspection handler with the real one:

- Upsert lead by phone (normalized to digits).
- Insert a `lead_inquiries` row per event.
- Update `bot_stage`, `last_bot_event_at`, and bump `warmth` (never downgrade) using the derivation rules from the previous turn.
- Return `{ ok, lead_id, warmth, bot_stage }` so ManyChat can save `lead_id` back as a custom field.
- Keep signature verification (`x-manychat-signature`) only if `MANYCHAT_WEBHOOK_SECRET` is set.

### Step 5 — Verify

- Ask you to fire the flow again from ManyChat.
- Read `edge_function_logs` for a success line.
- Query `leads` + `lead_inquiries` for the test phone via `supabase--read_query` and confirm the row shape.
- Confirm the lead appears in `/leads` with the correct warmth chip and bot stage.

## Why two deploys instead of one

I could guess the field names now, but every real integration I've seen where ManyChat is on the other side uses a different External Request body per project (you control what JSON gets posted from ManyChat's UI). Guessing risks silently writing wrong data into `leads` for every test you run. One 30-second inspection deploy removes that risk entirely.

## No DB changes

`leads.bot_stage`, `leads.warmth`, `leads.last_bot_event_at`, and `lead_inquiries.bot_stage / bot_event / payload` already exist from the previous turn. No migration needed.