## Scope

Ship the schema, the Marketing module UI (Templates + Journeys + Campaigns + Statistics), the in-drawer "send WhatsApp" buttons, and the placeholder Supabase Edge Functions that will later talk to ManyChat. **No real HTTP calls to ManyChat / no n8n.** Every send writes a `queued` row to `messages_log` and returns success — the outbound bridge is left as a documented TODO inside each edge function.

Email / Zoho explicitly out of scope. Existing `marketing_campaigns` table is dropped and rebuilt.

## 1. Database migration

New enums: `wa_template_category` (utility, marketing), `wa_template_status` (draft, pending, approved, rejected), `msg_status` (queued, sent, delivered, read, failed, replied), `journey_key` (leads, clients), `consent_channel` (whatsapp).

New tables (all with GRANTs to authenticated + service_role, RLS on, single "authenticated can do everything" policy for now — matches the rest of the app):

- `wa_templates` — id, name (unique, `[stage]_[purpose]_he`), category, status, body_he, variables jsonb (ordered `{{1}}..{{n}}` map with labels), notes, timestamps. Seeded with the 11 templates from the spec (T1–T12 minus T1 which is an in-window flow, kept as row with category=utility/status=draft for reference).
- `wa_journeys` — id, key (unique), name_he, description_he, is_active bool, updated_at. Seeded with `leads` and `clients` rows, both `is_active=false`.
- `wa_journey_steps` — id, journey_id, step_code (A1..A6 / B1..B9), order_index, name_he, trigger_he, template_id nullable, mode ('in_window' | 'template'), is_active bool, config jsonb (delay, quiet hours override, etc.). Seeded from the spec table.
- `journey_enrollments` — id, journey_id, customer_id, reservation_id nullable, current_step_code, paused_until timestamptz nullable, exited_reason text nullable, timestamps.
- `messages_log` — id, customer_id nullable, reservation_id nullable, campaign_id nullable, template_id nullable, journey_step_id nullable, phone text, direction ('out' | 'in'), status msg_status, error text nullable, payload jsonb, created_at, delivered_at, read_at, replied_at. Indexes on customer_id, reservation_id, campaign_id, created_at desc.
- `campaigns` — id, name_he, template_id, segment jsonb (source tags, lifecycle, property, date filters), coupon_code text nullable, scheduled_at timestamptz nullable, launched_at nullable, status ('draft' | 'scheduled' | 'running' | 'done' | 'cancelled'), stats jsonb (sent/delivered/read/replied counters — updated by edge fn), timestamps. Drops old `marketing_campaigns` after copying nothing (currently unused in UI beyond seed).
- `contact_tags` — id, customer_id, tag text, source ('manual' | 'system' | 'manychat'), created_at. Unique(customer_id, tag). Used for the ManyChat tag mirror.
- `contact_consent` — customer_id (pk), channel consent_channel default whatsapp, opted_in bool default true, updated_at, reason text nullable.

`customers` gets: `lifecycle text` (lead/booked/staying/past), `manychat_id text nullable`.

## 2. Placeholder Edge Functions

All under `supabase/functions/`, all Deno, all verify JWT of the calling user, all just write to Supabase and return `{ ok: true, todo: "wire ManyChat" }`. No external fetch.

- `wa-send-template` — body `{ phone, template_name, vars, customer_id?, reservation_id?, campaign_id?, journey_step_id? }`. Checks consent for marketing templates, dedupe (same template+phone within 48h), quiet-hours + Shabbat window (returns `queued` with `scheduled_for` note in payload), inserts `messages_log` row with status `queued`.
- `wa-send-bulk` — body `{ customer_ids[], template_name, vars_by_customer? }`. Iterates, per-customer calls the same insert logic, returns `{ queued, skipped: [{id, reason}] }`.
- `wa-sync-tags` — body `{ customer_id, add[], remove[] }`. Updates `contact_tags`. TODO: mirror to ManyChat.
- `wa-sync-contact` — body `{ customer_id }`. Reads customer + latest reservation, computes ManyChat field payload, returns it (no send). Used later by both journeys and campaigns.
- `wa-journey-toggle` — body `{ journey_key, is_active }` or `{ step_id, is_active }`. Flips the flag.
- `wa-journey-test-send` — body `{ step_id, to_phone }`. Inserts a `messages_log` row tagged `payload.test=true`.
- `wa-campaign-launch` — body `{ campaign_id }`. Resolves segment (SQL against customers + tags), sets status `running`, creates `messages_log` queued rows, updates `stats.queued`.
- `manychat-webhook` (public, `/functions/v1/manychat-webhook`, no JWT) — accepts stub payloads `{ event, phone, template?, status?, tags? }`, updates `messages_log` (sent/delivered/read/replied) and consent/tags. Signature check placeholder (env `MANYCHAT_WEBHOOK_SECRET`, verified when present, skipped when absent).

Each function logs `console.info("[TODO] outbound to ManyChat", payload)` where the real call will go.

## 3. Server functions layer

`src/lib/wa.functions.ts` (new, thin wrappers, all `.middleware([requireSupabaseAuth])`):

- `listTemplates`, `getTemplate`, `upsertTemplate`
- `listJourneys` (returns journeys + nested steps + template names)
- `toggleJourney`, `toggleJourneyStep`, `sendJourneyTest`
- `listCampaigns`, `getCampaign`, `upsertCampaign`, `launchCampaign`, `previewCampaignSegment` (returns count + first 20 rows)
- `listMessages({ customer_id?, reservation_id?, campaign_id?, limit })`
- `sendTemplateToCustomer({ customer_id, template_name, vars })`
- `sendTemplateBulk({ customer_ids, template_name })`
- `syncCustomerTags({ customer_id, add, remove })`
- `getMessagingStats({ range })` — aggregates funnel per journey step + per campaign from `messages_log`

Each wrapper invokes the matching edge function via `supabaseAdmin.functions.invoke` inside the handler (admin loaded via `await import`).

## 4. Marketing module UI

Sidebar entry "שיווק" (already exists as `/marketing`) becomes a route with tabs. Route file: `src/routes/_authenticated/marketing.tsx`.

Tabs:

1. **סקירה** — Statistics screen. Two sections:
   - Per journey step: sent → delivered → read → replied (+ click / booking columns for T2/T3/T11/T12), plus failure panel (invalid number, outside-window, opted-out).
   - Per active campaign: same funnel + attributed bookings via coupon code match.
2. **מסעות** — Journeys A & B rendered as step tables (from spec §4 §5). Each row: step code, trigger, template pill (tone by mode: gold=in_window, info=template U, purple=template M), on/off toggle, "שלח בדיקה אליי" button (opens small dialog with owner phone default). Journey-level master toggle at the top.
3. **תבניות** — Template library. Table with name, category pill, status pill (approved=success, pending=warning, rejected=danger), body preview, variable count. Row click opens right-drawer editor (name, category, body_he with `{{n}}` highlighter, variable labels editor, submit-for-approval button that just flips status → pending).
4. **קמפיינים** — Campaign list + wizard. New campaign wizard as a right-drawer (stepper: 1 בחר תבנית — filter to `marketing` approved; 2 הגדר קהל — pick lifecycle + source tags + property + last-stay-before date; live count via `previewCampaignSegment`; 3 קופון + תזמון; 4 סקירה + שגר). Existing campaigns table shows funnel numbers.

Files (new):
- `src/routes/_authenticated/marketing.tsx` — tab shell.
- `src/components/marketing/StatsTab.tsx`
- `src/components/marketing/JourneysTab.tsx`
- `src/components/marketing/TemplatesTab.tsx` + `TemplateEditorDrawer.tsx`
- `src/components/marketing/CampaignsTab.tsx` + `CampaignWizardDrawer.tsx`
- `src/components/marketing/FunnelBar.tsx` — small reusable sent/delivered/read/replied bar.
- `src/components/wa/SendTemplateDialog.tsx` — reusable send-template picker (used from customer, reservation drawers, and bulk-select bar). Consent-aware: greys out marketing templates when `contact_consent.opted_in=false`.

## 5. In-app send buttons (placeholders wired)

- **Customer drawer** (`customers.$id.tsx`) — add "שלח וואטסאפ" button in the toolbar → opens `SendTemplateDialog`. New tab "הודעות" already exists as תכתובות; extend to read from `messages_log` via `listMessages`.
- **Customers list** — bulk selection checkbox column + sticky bottom bar "שלח וואטסאפ (N)" → `sendTemplateBulk`.
- **Reservation drawer** (`reservations.$id.tsx`) — toolbar buttons: "שלח קישור מקדמה" (T6), "שלח טופס הורים" (T4), "שלח שובר ביטלס" (T9). New tab "הודעות".
- **Tasks** — the app doesn't have a Tasks module yet; the "החדר מוכן" button lives in the reservation drawer for now as "סמן חדר מוכן ושלח קוד" (T8). Adds `checkin_code text` to reservations.
- Tag chip editor in customer drawer → `syncCustomerTags`.

## 6. Seed data

Migration seeds:
- 11 `wa_templates` rows (T2–T12) with `status='approved'` for demo, body_he verbatim from spec, variables labeled.
- Journeys A + B and all steps wired to template rows via `template_id`; `is_active=false` at both journey and step level.
- Consent rows for all existing customers (`opted_in=true`).
- Backfill `lifecycle` from existing reservation state (`checkin`/`checkout` → staying/past, else booked; customers with no reservation → lead).
- ~20 sample `messages_log` rows across the last 14 days (mix of statuses) so the Stats tab shows real bars.

## Out of scope

- Any real HTTP call to ManyChat, WhatsApp Cloud API, or n8n.
- Email templates, Zoho, review-sentiment classification.
- Cron-driven journey execution (edge fn to evaluate B4/B7/B8 timings can be added in phase 2 via `pg_cron` + `pg_net` to `wa-journey-tick`).
- Coupon redemption tracking beyond storing the code on the campaign.

## Technical notes

- Every `*.functions.ts` file stays thin (wrappers only) per the serverfn-split rule; helpers live in `.server.ts` siblings.
- New tables follow the public-schema-grants rule (`GRANT` then `ENABLE RLS` then `CREATE POLICY`).
- Quiet-hours / Shabbat logic lives in a shared Deno module `supabase/functions/_shared/wa-guards.ts` so all send functions share it.
- Marketing tab uses the same `DetailLayout` visual language (colored section bars, TonePill for category/status).
