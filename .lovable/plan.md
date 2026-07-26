## Goal
Every KPI tile on all three dashboard tabs (תפעול · לידים · פיננסי) becomes clickable. Clicking opens a right-side drawer (RTL slide-over) listing the actual records that make up the number, each row linking to the relevant detail page — Zoho CRM style.

## UX

- `KpiCard` gains an optional `onClick`. When present: card gets hover lift, cursor-pointer, and a subtle ↖ affordance chip in the corner (matching gold/navy tone).
- A single reusable `KpiDrillDrawer` renders on the right (RTL "start"), 420px wide, with header (KPI label + count + close), scrollable body, and empty state ("אין רשומות").
- Body rows are compact list items styled like the existing `ActivityListCard` — primary text, muted meta, tone pill on the end, whole row clickable → navigates and closes the drawer.
- Abstract KPIs (occupancy %, ADR, RevPAR, conversion %, cancellation %) drill into the records that define the metric — see mapping below.

## KPI → drill mapping

**Operations**
- שוהים עכשיו → reservations where check_in ≤ today < check_out
- הגעות היום → today's arrivals
- עזיבות היום → today's departures
- תפוסה חודש → occupied unit-nights this month (list reservations overlapping current month)
- שהות ממוצעת → reservations from last 30d with nights
- שיעור ביטולים → cancelled reservations last 30d

**Leads**
- לידים חדשים החודש → leads created this month
- לידים פתוחים → leads not in booked/lost
- שיעור המרה → booked leads (last 90d)
- פניות השבוע → lead_inquiries created last 7d
- סה״כ פניות → all lead_inquiries (recent 50)

**Financial**
- הכנסות החודש → paid invoices this month
- יתרת גבייה → sent + overdue invoices
- בפיגור → overdue invoices (due_date < today, not paid)
- ADR → checkout reservations last 30d with nights + total
- RevPAR → same set, contextualized
- ח״ם פתוחות → same as יתרת גבייה, table shape

## Backend

Add one server fn: `getDashboardDrill({ key })` in `src/lib/data.functions.ts`, `.middleware([requireSupabaseAuth])`, input validated to a union of the ~17 keys above. Returns `{ title: string, rows: DrillRow[] }` where `DrillRow` is a discriminated union: `reservation | lead | inquiry | invoice | customer` — each carrying `id`, `primary`, `secondary`, optional `tone`+`pillLabel`, and a `link` descriptor `{ to, params }` the drawer feeds straight into `nav()`.

Single server fn (not 17) keeps the surface small; internal `switch(key)` builds each query. Reuses existing Supabase reads — no new tables, no schema changes.

## Frontend

Files touched:
- `src/components/dashboard/KpiCard.tsx` — add optional `onClick`, hover/cursor when clickable, small "↖" gold affordance.
- `src/components/dashboard/KpiDrillDrawer.tsx` (new) — RTL fixed drawer, backdrop, Escape/click-out close, `useServerFn(getDashboardDrill)` + `useQuery` keyed on drill key, renders rows via a tiny `<DrillRow>` that resolves `link` through `useNavigate()`.
- `src/components/dashboard/OperationsTab.tsx`, `LeadsTab.tsx`, `FinancialTab.tsx` — local `const [drill, setDrill] = useState<Key|null>(null)`, pass `onClick={() => setDrill("arrivals_today")}` to each `KpiCard`, mount one `<KpiDrillDrawer drillKey={drill} onClose={() => setDrill(null)} />` per tab.
- `src/lib/data.functions.ts` — add `getDashboardDrill` + `DrillRow` type export.

## Out of scope

- No new tables, no schema/RLS changes.
- Chart bars/segments stay non-clickable (KPIs only, per your answer).
- No dashboard layout redesign — only KPI interaction and one shared drawer.
