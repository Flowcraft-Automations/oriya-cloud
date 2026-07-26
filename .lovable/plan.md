## Goal
Add detail pages for Customers, Leads, and Reservations (Orders), reachable by clicking a row/card. Each shows full profile + related history.

## New routes
- `/_authenticated/customers/$id` — customer detail
- `/_authenticated/leads/$id` — lead detail
- `/_authenticated/reservations/$id` — reservation detail

Each row/card in the existing list pages becomes a `<Link>` to its detail route (kept inline delete via stopPropagation).

## Customer detail page
Header: name, phone (click-to-call/WhatsApp), email, tags, notes (editable).
Sections:
1. **Stay history** — table of all reservations for this customer (dates, unit, nights, channel, status, total, paid). Click row → reservation detail.
2. **Stats** — total stays, total spent, avg nights, last stay, lifetime channels used.
3. **Ratings** — per-stay rating (1–5) + review text. Requires new nullable columns `rating smallint`, `review text` on `reservations` (migration).
4. **Communications** — WhatsApp campaigns + emails sent to this customer. Requires new table `communications` (id, customer_id nullable, lead_id nullable, channel: whatsapp|email, direction: outbound|inbound, campaign_id nullable, subject, body, sent_at, status). Empty state now; wired for future sends. Optional link to `marketing_campaigns`.

## Lead detail page
Header: name, phone, email, source, current stage (editable dropdown), created_at, assigned property.
Sections:
1. **Inquiries** — list of every inquiry from this lead (source, timestamp, requested unit/property if any, dates of interest, message). Requires new table `lead_inquiries` (id, lead_id, source, unit_id nullable, property_id nullable, check_in nullable, check_out nullable, guests nullable, message, created_at). Migrate current single-inquiry lead into one seed row per existing lead.
2. **Communications** — same `communications` table (filtered by lead_id): WhatsApp/email campaigns received, replies.
3. **Convert to customer / reservation** — action button (creates customer from lead data, prefilled reservation link to calendar).
4. **Notes** — editable.

## Reservation (order) detail page
Header: guest name, unit, channel badge, status dropdown, dates + nights.
Sections:
1. **Guest** — link to customer profile if `customer_id`, else "Attach to customer" action.
2. **Financials** — total, paid, balance, editable paid_amount, quick "mark fully paid" button.
3. **Dates & occupancy** — check-in/out (editable), adults/children (editable).
4. **Notes** — editable textarea, autosave on blur.
5. **Rating & review** — editable once status = checkout.
6. **Communications** — messages tied to this customer around the stay window.
7. **Delete** with confirm.

## Backend changes (one migration)
- Add `rating smallint`, `review text` to `reservations`.
- Create `communications` table + grants + RLS (owner via customer/lead join).
- Create `lead_inquiries` table + grants + RLS (owner via lead join).
- Backfill: one `lead_inquiries` row per existing lead using its current `interest`, `source`, `property_id`, `created_at`.

## Server functions (`src/lib/data.functions.ts`)
- `getCustomer({id})` → customer + reservations[] + communications[] + aggregates.
- `getLead({id})` → lead + inquiries[] + communications[].
- `getReservation({id})` → reservation + unit + property + customer.
- `updateCustomer`, `updateLead`, `updateReservation` (partial patch).
- `addCommunication`, `addLeadInquiry` (for future/manual entry).

## List page wiring
- `customers.tsx`, `leads.tsx`, `reservations.tsx`: wrap rows/cards in `<Link to="/customers/$id" params={{id}}>` etc. Keep delete button with `e.stopPropagation()`.

## Out of scope
- Actually sending WhatsApp/email (schema + UI list only, no provider integration).
- Star-rating widget beyond a 1–5 numeric input.
- Realtime updates.

Confirm and I'll implement.
