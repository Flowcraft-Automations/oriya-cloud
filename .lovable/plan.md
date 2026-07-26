## Goal
When a contact progresses through the ManyChat leads bot, ManyChat posts to a Supabase webhook. The webhook upserts a lead by phone (source = `bot`), records the current bot stage as a `lead_inquiries` row, and updates two new fields on `leads`: `bot_stage` (last node reached) and `warmth` (חמימות: cold/warm/hot).

## 1. DB migration
Add to `public.leads`:
- `bot_stage text` — last ManyChat node id / label (e.g. `msg_1`, `choose_apt_U360`, `dates_captured`).
- `warmth text` — enum-like: `cold | warm | hot` (default `cold`).
- `last_bot_event_at timestamptz`.

Add to `public.lead_inquiries`:
- `bot_stage text`, `bot_event text` (e.g. `apt_selected`, `dates_selected`, `guests_selected`, `handoff`), `payload jsonb` (raw ManyChat custom fields for that step).

No table rename; keep existing RLS + owner_id defaults.

## 2. Webhook endpoint
Reuse the existing `supabase/functions/manychat-webhook` (already public, `verify_jwt=false`). Extend it to accept a new event family:

```
POST /functions/v1/manychat-webhook
Header: x-manychat-signature: <MANYCHAT_WEBHOOK_SECRET>
Body:
{
  "event": "lead_stage",
  "phone": "+9725...",
  "full_name": "…",           // optional
  "stage": "msg_7_apt_U360",   // ManyChat node
  "bot_event": "apt_selected", // semantic label from the flow
  "warmth": "warm",            // optional override; else derived
  "fields": {                  // any ManyChat custom fields to store
    "apt": "U360", "check_in": "2026-08-10", "check_out": "2026-08-12",
    "guests": 2, "audience": "couple"
  }
}
```

Handler logic:
1. Verify shared secret.
2. Normalize phone (strip non-digits, keep leading `+`).
3. Upsert `leads` by `phone`:
   - If new → insert `{ full_name: fields.name ?? "ליד וואטסאפ", phone, source: 'bot', stage: 'new', bot_stage, warmth, last_bot_event_at: now() }`.
   - If existing → update `bot_stage`, `warmth` (only if higher than current — see rule below), `last_bot_event_at`, and bump `stage` from `new`→`contacted` on first bot reply.
4. Insert one `lead_inquiries` row for every event (source `bot`, includes `bot_stage`, `bot_event`, mapped `unit_id` if `fields.apt` matches a unit name, `check_in/out`, `guests`, `message`, `payload`).
5. Warmth derivation (server-side, if not provided):
   - `cold` = only entered flow.
   - `warm` = selected an apartment OR audience.
   - `hot` = provided dates + guests, or clicked "לאתר" / requested handoff.
   Never downgrade — take `max(existing, new)`.
6. Optional: on `bot_event = 'handoff'` set `leads.stage = 'contacted'` and log a `messages_log` note.

Response: `{ ok: true, lead_id, warmth, bot_stage }` so ManyChat can store `lead_id` as a custom field for later events.

## 3. Lead detail UI (small additions)
- Header: show a warmth chip (cold=neutral, warm=gold, hot=danger tone) next to the existing stage pill.
- Profile section: add `bot_stage` and `last_bot_event_at` as read-only rows (inline-edit disabled for these two).
- Inquiries tab: existing timeline already renders `source=bot` — surface `bot_event` and `bot_stage` as small labels above the message.

No changes to marketing/journeys.

## 4. ManyChat side (config the user does, not code)
- Add an "External Request" action after each Send Message node with:
  - URL: `https://lymympugpgukoaowczov.supabase.co/functions/v1/manychat-webhook`
  - Header `x-manychat-signature: {{MANYCHAT_WEBHOOK_SECRET}}`
  - Body: JSON template with `event: "lead_stage"`, current node id as `stage`, semantic `bot_event`, and any captured custom fields.
- On first message: also send `full_name` if collected.

## 5. Secret
Confirm `MANYCHAT_WEBHOOK_SECRET` is set in Supabase Edge Function secrets (used both for signature check and by ManyChat).

## Out of scope
- Real HMAC signature (still shared-secret compare, matching current stub).
- Journey enrollment / auto-sending from the bot events (can layer later on top of `warmth` transitions).
- Email/Zoho.

## Open question
Warmth ladder — is `cold → warm → hot` the right 3 levels, or do you want a 4th (`very hot` = asked for price/booking link)? Default: 3 levels as above unless you say otherwise.
