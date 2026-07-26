# Unified detail pages + Payments module

Apply the customer detail layout (header strip, name + status pill, action toolbar, tags row, tabbed body with colored side-bar sections) to every module's detail page, with per-module tab sets, and add a Payments/Invoices module.

## Shared detail-page shell

Extract the layout from `customers.$id.tsx` into a reusable component `src/components/detail/DetailLayout.tsx` accepting:
- top strip (status, pagination, delete)
- title, subtitle, status pill, flag/icon slot
- action toolbar buttons
- tags row
- `tabs: { key, label, count? }[]` + active tab state
- children (tab content)

Refactor all detail pages to consume it so layout stays identical.

## Per-module tabs

**Customers** (`customers.$id.tsx`) — tabs: `פרופיל`, `הזמנות`, `תשלומים`
- Remove: AI Profile, Correspondence, Campaigns, Notes, Timeline, Finances
- Orders tab: existing reservations table (link to reservation detail)
- Payments tab: list of invoices for this customer (from new invoices table)

**Leads** (`leads.$id.tsx`) — tabs: `פרופיל`, `פניות`
- Profile: contact + source + status fields in the same side-bar sections style
- Inquiries: rows from `lead_inquiries` (source, date, unit/suite if relevant, message)

**Reservations** (`reservations.$id.tsx`) — tabs: `פרטים`, `לקוח`, `תשלומים`
- Details: dates, unit, channel, status, nights, total, **rating + review** (editable)
- Client: linked customer summary card + link to customer detail
- Payments: invoices tied to this reservation + "צור חשבונית" button

## Payments module (new)

Schema migration:
- `invoices` table: `id`, `owner_id`, `customer_id`, `reservation_id?`, `invoice_number`, `issue_date`, `due_date`, `amount`, `tax`, `total`, `status` (`draft`|`sent`|`paid`|`overdue`|`cancelled`), `notes`, timestamps
- RLS scoped to `owner_id`; GRANTs for authenticated + service_role; updated_at trigger
- Seed ~8 sample invoices tied to existing reservations/customers

Server functions in `src/lib/data.functions.ts`:
- `listInvoices`, `getInvoice`, `createInvoice`, `updateInvoice`, `deleteInvoice`
- `listInvoicesByCustomer(customerId)`, `listInvoicesByReservation(reservationId)`

Nav: add "תשלומים" under ניהול group in `src/lib/mock/nav.ts`.

Routes:
- `src/routes/_authenticated/payments.index.tsx` — list view (filter chips: הכל / טיוטה / נשלח / שולם / בפיגור), table with number/customer/date/total/status, row-click to detail
- `src/routes/_authenticated/payments.$id.tsx` — detail using DetailLayout, tabs: `פרטים`, `לקוח`, `הזמנה`. Editable amount/status; linked customer + reservation cards.

## Reservation detail rating

Add rating (1–5 stars) + review text editor on the Details tab, wired to existing `updateReservation` (columns already exist from earlier migration).

## Out of scope

No PDF export, no payment provider integration — invoices are internal records only.
