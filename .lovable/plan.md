## Goal
Replace the single dashboard with a tabbed view containing three focused dashboards, each fed by real data from Supabase. Keep interconnections consistent; top up seed data only where the current volume is too thin to make a chart meaningful.

## Structure
`src/routes/_authenticated/index.tsx` renders a page header + a tab strip (`תפעול` · `לידים ומכירות` · `פיננסי`), each tab a self-contained dashboard component. URL syncs via `?tab=ops|leads|finance` (default `ops`).

## Tab 1 — תפעול (Check-in cycle)
Data: `reservations`, `units`, `properties`.
- KPIs: staying now, arrivals today, departures today, occupancy this month, avg stay length, cancellation rate (last 30d).
- 7-day arrivals/departures stacked bar (today ±3).
- Today's arrivals list (guest, unit, phone, status pill) + departures list.
- Upcoming week table: date, unit, guest, channel, status — clickable to reservation detail.
- Unit status strip: each unit → currently occupied / free / arriving today, colored.

## Tab 2 — לידים ומכירות (Leads)
Data: `leads`, `lead_inquiries`, `reservations` (for booked conversions), `communications`.
- KPIs: new leads this month, open leads (not booked/lost), conversion rate (booked / total closed), avg time-to-book, inquiries this week.
- Funnel bar: new → contacted → quoted → booked / lost with counts.
- Source breakdown pie (website, whatsapp, tzimmerer, instagram, referral, other) with % and counts.
- Inquiries-per-property bar (from `lead_inquiries.property_id`).
- Recent inquiries list (source pill, property, dates, guest name) — clickable to lead.
- Top-of-funnel: 5 newest leads with stage pill + last-contact date.

## Tab 3 — פיננסי (Financial)
Data: `invoices`, `reservations`.
- KPIs: revenue this month (paid invoices), outstanding balance (sent+overdue), overdue amount, ADR, RevPAR, paid-invoice count.
- Revenue by month bar (last 6 months, current highlighted) — from paid invoices `issue_date`.
- Paid vs outstanding donut (this month).
- Revenue by channel bar (sum `reservations.total_amount` per channel this month).
- Outstanding invoices table: number, customer, due date, days overdue, total, status pill — clickable to payment detail.
- Top customers by revenue (last 90d), top 5.

## Seed top-up (only if needed to make charts meaningful)
After counting current data:
- If <8 paid invoices exist across last 6 months → add historical paid invoices tied to existing checkout reservations spanning 6 months so the revenue-by-month chart is non-trivial. New invoices reuse existing `customer_id` + `reservation_id`; no orphan rows.
- If fewer than 6 leads have `stage='booked'` → mark a few existing leads booked and set their `booked_reservation_id` (if column exists) or match by phone to an existing reservation so funnel + conversion have real numbers.
- No new customers, reservations, or units created — interconnection integrity preserved.

## Backend
Add three server functions in `src/lib/data.functions.ts`:
- `getOperationsDashboard()` — arrivals/departures ±3 days, unit status, KPIs.
- `getLeadsDashboard()` — funnel counts, source mix, inquiries-per-property, recent inquiries, KPIs.
- `getFinancialDashboard()` — monthly revenue series, paid/outstanding, channel revenue, overdue list, top customers, KPIs.

Existing `getDashboardData` is removed after the new page is wired.

## Frontend
- `src/routes/_authenticated/index.tsx` — tab shell reading `?tab`.
- `src/components/dashboard/OperationsTab.tsx`, `LeadsTab.tsx`, `FinancialTab.tsx` — each uses `useSuspenseQuery` on its own server fn.
- Reuse `KpiCard`, `ActivityListCard`, `RevenueChart`, `OccupancyChart`, `ChannelMixChart`, `TonePill`. Add a small `FunnelBar` and `MiniDonut` inline where needed.
- Preserve RTL, existing navy/gold palette, and inline navigation to detail pages.

## Out of scope
No schema changes, no new tables, no auth changes, no changes to other modules' pages.
