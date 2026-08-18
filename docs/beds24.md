# Beds24 two-way sync

Two-way sync between the CRM and [Beds24](https://beds24.com) (channel manager for Booking.com etc.).

- **Inbound:** Beds24 fires a booking webhook → `supabase/functions/beds24-webhook` upserts the reservation locally (matched by `beds24_booking_id`).
- **Outbound:** creating/blocking/cancelling a reservation on a mapped unit goes through `supabase/functions/beds24-push`, which writes to Beds24 **first** and only then writes the local row. A local date overlap rolls the Beds24 booking back and surfaces `התאריכים תפוסים` in the UI.
- A Postgres exclusion constraint (`reservations_no_overlap`) hard-blocks overlapping non-cancelled reservations per unit as the last line of defense.
- Every sync call (both directions) is logged in `public.integration_sync_log`.

## 1. Generate the API invite code

1. Log in to Beds24 → **Settings → Apps & Integrations / Marketplace → API**.
2. Generate an **invite code** with these scopes:
   - **bookings** — read + write
   - **properties** — read
   - **inventory** — read + write
3. The invite code **expires in 24 hours** — do the next step promptly.

## 2. Exchange the invite code for a long-life refresh token

```bash
curl -s "https://api.beds24.com/v2/authentication/setup" \
  -H "code: <INVITE_CODE>"
```

The response contains `refreshToken` — this is the long-life credential. (It stays valid as long as it is used at least once every 30 days; the sync's token refreshes handle that automatically once traffic flows.)

## 3. Configure Supabase secrets

Supabase Dashboard → **Edge Functions → Secrets** (or `supabase secrets set`):

| Secret | Value |
|---|---|
| `BEDS24_REFRESH_TOKEN` | the `refreshToken` from step 2 |
| `BEDS24_WEBHOOK_SECRET` | any long random string (e.g. `openssl rand -hex 24`) |

Access tokens are cached in the `beds24_token_cache` table and refreshed automatically ~5 minutes before expiry.

## 4. Configure the webhook in Beds24

For **each property**: Beds24 → **Settings → Properties → Access → Booking Webhook**:

- **Version:** 2
- **URL:**

```
https://lymympugpgukoaowczov.supabase.co/functions/v1/beds24-webhook?secret=<BEDS24_WEBHOOK_SECRET>
```

Requests without the correct `?secret=` are rejected with 403.

## 5. Map units to Beds24 rooms

Set the Beds24 ids on each unit (find them in Beds24 under the property/room settings):

```sql
update public.units
   set beds24_property_id = <propId>, beds24_room_id = <roomId>
 where name = '<unit name>';
```

Units with `beds24_room_id IS NULL` keep the plain local flow (no Beds24 calls); the overlap constraint still protects them.

## 6. Manual test matrix

| # | Direction | Test | Expected |
|---|---|---|---|
| 1 | Inbound | Create a booking in the Beds24 control panel on a mapped room | Reservation appears in the CRM with `sync_source='beds24'`, correct dates/guest/status; `integration_sync_log` row `inbound`/`processed` |
| 2 | Inbound | Modify that booking's dates in Beds24 | Local reservation's dates update (same `beds24_booking_id`, no duplicate row) |
| 3 | Inbound | Cancel that booking in Beds24 | Local reservation flips to `cancelled` |
| 4 | Outbound | Create a reservation in the CRM calendar on a mapped unit | Booking appears in Beds24 (status confirmed); local row has `beds24_booking_id`, `sync_source='app'` |
| 5 | Outbound | Create a reservation with channel חסימה (block) on a mapped unit | Beds24 shows a `black` block; local row channel `block` |
| 6 | Outbound | Create a reservation overlapping an existing one on the same unit | UI shows **התאריכים תפוסים**; no local row; the transient Beds24 booking is cancelled (see `*_compensating_cancel` row in `integration_sync_log`) |
| 7 | Outbound | Cancel a synced reservation in the CRM | Beds24 booking becomes cancelled; local status `cancelled` |

Useful during testing:

```sql
select id, direction, event, status, error, created_at
  from integration_sync_log
 order by created_at desc
 limit 20;
```

## Troubleshooting

- **Webhook returns 403** — `BEDS24_WEBHOOK_SECRET` not set in Supabase, or the URL's `?secret=` doesn't match.
- **`unit_not_mapped` / `unknown_room` errors** — the unit's `beds24_room_id` isn't set (step 5).
- **Token errors in the log** — `BEDS24_REFRESH_TOKEN` missing/expired (regenerate via steps 1–2; it dies after 30 days of zero use).
- **Rate limiting** — the client logs a warning when Beds24's `x-five-min-limit-remaining` header drops below 20.
