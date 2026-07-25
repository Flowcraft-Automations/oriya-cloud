# Oriya OS — Phase 1 Build Plan

Building the foundation: design system, RTL app shell, dashboard, and multi-unit calendar. Modules (reservations, leads, customers, agents, properties, payments, expenses, marketing, tasks) come in subsequent phases per your guidance ("shell + dashboard + calendar first, then add modules screen-by-screen").

## Scope of this phase

1. **Design system foundation** — color tokens, typography, RTL setup
2. **App shell** — right-side dark sidebar, top bar, page layout pattern
3. **Dashboard** (`/`) — KPIs, charts, activity lists
4. **Calendar** (`/calendar`) — multi-unit reservation grid
5. **Route stubs** for the remaining nav items so navigation works (empty "coming soon" pages)

Data is mocked in TypeScript files for this phase. No Lovable Cloud / database yet — you asked whether to do schema next, so we'll tackle that as a follow-up once the UI is validated.

## 1. Design system

**`src/styles.css`** — replace default tokens:
- Load Heebo via `<link>` in `__root.tsx` head (Google Fonts, weights 400/500/600/700)
- Convert the full token block from the spec (navy 900/800/700/500/100, gold 600/500/100, canvas, text, semantic, channel colors) to CSS variables in `:root`
- Map to Tailwind via `@theme inline` (e.g. `--color-navy-900`, `--color-gold-600`, `--color-bg-subtle`)
- Set `body { font-family: "Heebo", sans-serif; }` and `html { direction: rtl; }`
- Utility class `.ltr-num` with `direction: ltr; unicode-bidi: isolate; font-variant-numeric: tabular-nums` for phones/currency
- Card shadow token, radius 12px default

**`src/routes/__root.tsx`** — add `<html lang="he" dir="rtl">`, Heebo font link, update meta (title "Oriya OS · מערכת ניהול").

## 2. App shell

**`src/components/shell/AppShell.tsx`** — grid layout: sidebar 240px on the right, top bar 64px, content area white with padding.

**`src/components/shell/Sidebar.tsx`** — fixed right, `--navy-900` bg:
- Logo block "Oriya OS · מערכת ניהול"
- 4 groups (תפעול / פורטפוליו / כספים / שיווק) with 11px uppercase-tracking labels in `--text-on-dark-muted`
- Nav items: lucide icon + Hebrew label, active state = `--navy-800` pill + 3px `--gold-600` bar on the right edge (RTL start edge)
- Footer: version tag + collapse toggle
- Uses TanStack `Link` + `useRouterState` for active detection

**`src/components/shell/TopBar.tsx`** — white, bottom border:
- RTL start (right): global search input with icon, `--bg-subtle` fill
- LTR start (left): notification bell w/ dot, language switcher (עב/EN), user chip (navy avatar + name + "מנהל מערכת")

**`src/components/shell/PageHeader.tsx`** — reusable H1 + subtitle right-aligned, primary action button on the far left. Variants: `navy` (default) and `gold` (single top CTA).

**`src/components/shell/FilterChips.tsx`** — pill chip row, default `--bg-subtle`, selected `--navy-700` white.

Wrap `<Outlet />` in `AppShell` inside `__root.tsx`.

## 3. Dashboard (`src/routes/index.tsx`)

Replace placeholder. Sections:
- Greeting header ("בוקר טוב · [date] · תמונת מצב של הפורטפוליו")
- **4 KPI cards** (`KpiCard` component): שיחות פתוחות, שוהים עכשיו, תפוסה החודש %, הכנסות החודש ₪. Icon in tinted square (3 navy-100, 1 gold-100), 28px bold tabular number, label + sub-line.
- **3 chart cards** (Recharts): הכנסות לפי חודש (bar, current month gold), מגמת תפוסה (line), מיקס ערוצים (donut w/ channel colors)
- **3 list cards**: הגעות היום, עזיבות היום, לידים חדשים — each with "הכל ←" link

Mock data in `src/lib/mock/dashboard.ts`. Head meta specific to this route.

## 4. Calendar (`src/routes/calendar.tsx`)

**Toolbar**: segmented control (היום · שבוע · שבועיים · חודש), month picker, prev/next arrows, property filter dropdown, unit search, channel legend chips.

**Grid** (`src/components/calendar/CalendarGrid.tsx`):
- Sticky right column = unit names grouped under property headers (U360, Seaside, Royal Park, Bar Lavi)
- Date columns with Hebrew day letter + date; Saturdays tinted `--bg-subtle`, today tinted `--navy-100`
- Reservation bars: absolutely-positioned, rounded, channel-colored, guest name inside
- Blocks = diagonal-stripe pattern in `--ch-block`
- Click bar → Popover with guest name, phone (LTR), dates, status dropdown, quick action icons

CSS Grid for the layout (sticky right column via `position: sticky; right: 0`). Two-week view first; other views wired as toolbar state.

Mock data in `src/lib/mock/calendar.ts` (4 properties, ~12 units, ~30 reservations across current 2 weeks).

## 5. Route stubs

Create empty `createFileRoute` pages so the sidebar links resolve:
`reservations`, `leads`, `customers`, `agents`, `reviews`, `properties`, `payments`, `expenses`, `pricing`, `coupons`, `cancellation-policy`, `tasks`, `campaigns`, `journeys`, `marketing-stats`. Each renders a `PageHeader` + a "בקרוב" placeholder card. Each has route-specific `head()` meta.

## Technical details

- Stack: TanStack Start (existing), Tailwind v4, shadcn/ui, Recharts, lucide-react, Heebo font
- No new packages beyond what's needed — recharts and shadcn are already available; add via shadcn CLI if a primitive is missing
- Tailwind v4 tokens defined in `@theme inline` — reference existing token style in `src/styles.css`
- All currency/phone rendering wrapped with `.ltr-num` utility
- No Lovable Cloud in this phase — mock data only
- Dark mode: not in scope now (Sxivo is light-only, spec is light-only)
- Mobile bottom tab bar: stub in place, full styling in a later polish pass

## Files created/modified

Modified: `src/styles.css`, `src/routes/__root.tsx`, `src/routes/index.tsx`

Created:
- `src/components/shell/{AppShell,Sidebar,TopBar,PageHeader,FilterChips,UserChip}.tsx`
- `src/components/dashboard/{KpiCard,RevenueChart,OccupancyChart,ChannelMixChart,ActivityListCard}.tsx`
- `src/components/calendar/{CalendarToolbar,CalendarGrid,ReservationBar,ReservationPopover,ChannelLegend}.tsx`
- `src/lib/mock/{dashboard,calendar,nav}.ts`
- `src/routes/calendar.tsx` + 15 stub route files

## Out of scope (next phases)

Reservations table + drawer, Leads kanban, Customers, Agents inline-form pattern, Properties + pricing, Payments/Expenses, Marketing (campaigns/journeys/stats), Tasks & cleaning scheme, Supabase schema, real auth, WhatsApp/Channex integrations.

Want me to also draft the Supabase schema in parallel so Phase 2 modules can bind to real tables? Say the word after approving this plan.
