## Goal

Build a real Supabase-backed backend for every module in the app and remove all hardcoded mock data (`src/lib/mock/dashboard.ts`, `src/lib/mock/calendar.ts`). All screens will read from the database via authenticated TanStack server functions, scoped per user (owner).

## Auth model

- Add Supabase email/password auth (sign-in page at `/auth`, public route).
- Move all authenticated app routes (dashboard, calendar, reservations, properties, leads, customers) under `src/routes/_authenticated/` behind the managed auth gate.
- Every table scoped by `owner_id = auth.uid()` with strict RLS. No public reads.

## Database schema (single migration)

Tables (all with `id uuid pk`, `owner_id uuid`, `created_at`, `updated_at`, RLS + owner-only policies + GRANTs):

- **properties** — name, address, notes
- **units** — property_id, name, capacity, base_price, notes
- **rate_seasons** — property_id, name, start_date, end_date, nightly_rate, min_nights
- **customers** — full_name, phone, email, id_number, tags (text[]), notes
- **reservations** — unit_id, customer_id (nullable), guest_name (denorm), phone, channel (enum: booking/direct/tzimmerer/airbnb/vrbo/block), status (enum: pending/confirmed/checkin/checkout/cancelled), check_in date, check_out date, nights (generated), adults, children, total_amount, paid_amount, notes
- **leads** — full_name, phone, email, source (enum: whatsapp/website/tzimmerer/instagram/referral/other), interest, stage (enum: new/contacted/quoted/booked/lost), property_id (nullable), notes
- **marketing_campaigns** — name, channel, status, start_date, end_date, budget, notes (integrated with leads module)

Enums created via `CREATE TYPE`. Triggers: `updated_at` auto-update on every table. Index on `reservations(owner_id, check_in, check_out)` and `reservations(unit_id, check_in)`.

## Server functions (`src/lib/*.functions.ts`, all `.middleware([requireSupabaseAuth])`)

- `properties.functions.ts`: list/create/update/delete properties, list units, create/update/delete unit, list/create/update/delete rate seasons
- `reservations.functions.ts`: list (with date-range filter for calendar), create, update, delete, updateStatus; also `getDashboardStats` for KPIs (open convos placeholder=0, staying-now, arrivals/departures today, month occupancy %, month revenue, ADR, RevPAR), `getRevenueByMonth` (last 7 months), `getOccupancyTrend`, `getChannelMix`
- `customers.functions.ts`: list/create/update/delete/get
- `leads.functions.ts`: list/create/update/delete/updateStage; `listCampaigns`, campaign CRUD

## Frontend wiring (delete mocks, use TanStack Query)

- Delete `src/lib/mock/dashboard.ts` and `src/lib/mock/calendar.ts`. Keep `nav.ts`.
- Dashboard (`_authenticated/index.tsx`): replace `kpis`, `revenueByMonth`, `occupancyTrend`, `channelMix`, `arrivalsToday`, `departuresToday`, `newLeads` with `useSuspenseQuery` results from server fns. Empty states when no data.
- Calendar (`_authenticated/calendar.tsx` + `CalendarGrid`): fetch properties+units+reservations for the visible date range. Compute `startOffset`/`length` from `check_in`/`check_out` relative to grid start. Wire "הזמנה חדשה" button + reservation popover status change to real mutations.
- Reservations: real table with filters (status, channel, date range), inline create form (per your spec, no modal), edit, cancel.
- Properties (`נכסים ומחירונים`): properties list with nested units, rate-seasons editor per property.
- Leads (`לידים ושיווק`): kanban by stage with drag-to-update, inline add lead, campaigns list tab.
- Customers: table with search, tags, click-through to customer card with reservation history (join to reservations by phone or customer_id).

All list/detail views: `ensureQueryData` in loader, `useSuspenseQuery` in component, `useMutation` + `invalidateQueries` for writes, `errorComponent` + `notFoundComponent` on every route.

## Auth plumbing

- Install/verify `attachSupabaseAuth` in `src/start.ts` (or existing bearer middleware).
- `src/routes/auth.tsx`: public sign-in / sign-up with Supabase email+password.
- `src/routes/_authenticated/route.tsx`: managed auth gate (redirects to `/auth`).
- Move existing route files under `_authenticated/` (index, calendar, reservations, properties, leads, customers).
- Root `onAuthStateChange` wired to invalidate router + query cache on SIGNED_IN/OUT/USER_UPDATED only.

## What's out of scope for this pass

- No channel-manager integrations (Booking.com/Airbnb sync) — channels remain a manual field on reservations.
- No WhatsApp/messaging inbox — the "שיחות פתוחות" KPI shows 0 until that module is built.
- No file storage / parents-form uploads yet.
- No seed data — every account starts empty and gets an inline "add your first property" empty state.

## Order of execution

1. Migration (schema + RLS + GRANTs + triggers).
2. Auth: `/auth` page, `_authenticated` gate, move routes, bearer attacher.
3. Server functions per module.
4. Rewire Dashboard + Calendar (delete `mock/dashboard.ts` + `mock/calendar.ts`).
5. Build Reservations, Properties, Leads, Customers screens with real CRUD.
6. Typecheck; verify sign-in → empty dashboard → create property → create reservation → appears on calendar.
