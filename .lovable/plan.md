## Goal
Wire the existing mock data together so customers, reservations, and payments all cross-reference each other and profile pages show real history.

## Current state (verified)
- 12 customers, 16 reservations, 12 leads with 15 inquiries.
- **All 16 reservations have `customer_id = NULL`** even though every `guest_name`/`phone` matches an existing customer row.
- **0 invoices** and **0 communications** exist, so customer/reservation "תשלומים" and "תכתובות" tabs are always empty.

## Changes (data only — no schema, no code)

### 1. Link reservations to customers
Update every reservation's `customer_id` by matching `guest_name` + `phone` to the `customers` table. All 16 will get linked.

### 2. Generate invoices tied to both reservation and customer
For each reservation that has money on it (skip `pending`/`cancelled` with 0 paid), create 1–2 invoice rows with `reservation_id` and `customer_id` populated:
- `checkout` → one `paid` invoice for the full amount.
- `checkin` → one `paid` invoice (deposit = `paid_amount`) + one `sent` invoice (balance, due at checkout).
- `confirmed` with partial payment → one `paid` deposit invoice + one `sent` balance invoice.
- `confirmed` fully paid → one `paid` invoice.
- Amounts split as `amount` (pre-VAT) + `tax` (17%) + `total`, using the existing `total_amount`/`paid_amount` figures. `invoice_number` follows `INV-2026-####`.

### 3. Generate communications history
Insert ~25 `communications` rows across the 12 customers (WhatsApp + email mix, some tied to a specific `reservation_id`): booking confirmations, pre-arrival WhatsApp, checkout thank-you, review request. Content in Hebrew.

## Result
- Customer detail → "הזמנות" lists their real stays, "תשלומים" shows their invoices, "תכתובות" shows past messages.
- Reservation detail → "לקוח" tab resolves to the real customer card; "תשלומים" shows deposit/balance invoices.
- Payment detail → "לקוח" and "הזמנה" tabs both link to real records.
