## Root cause

Confirmed via routeTree.gen.ts + a live click test: `/customers/$id`, `/leads/$id`, and `/reservations/$id` are registered as children of `/customers`, `/leads`, `/reservations` (`AuthenticatedCustomersRouteWithChildren`, etc.). Because the parent files (`customers.tsx`, `leads.tsx`, `reservations.tsx`) render their list UI directly instead of an `<Outlet />`, TanStack keeps rendering the parent's list when the URL matches a child — the URL updates and the child's `head()` runs (title changes to "כרטיס ליד"), but the child component never mounts.

This is exactly the layout-vs-leaf pattern documented in tanstack-route-architecture: a parent route with children must return `<Outlet />`; the page body must move to a `*.index.tsx` sibling.

## Fix

Rename each list route to an index leaf so its sibling `$id` route stops being nested under it:

- `src/routes/_authenticated/customers.tsx` → `src/routes/_authenticated/customers.index.tsx`
- `src/routes/_authenticated/leads.tsx` → `src/routes/_authenticated/leads.index.tsx`
- `src/routes/_authenticated/reservations.tsx` → `src/routes/_authenticated/reservations.index.tsx`

Inside each renamed file, update the `createFileRoute("/_authenticated/<name>")` string to `createFileRoute("/_authenticated/<name>/")` so it matches the new generated route ID.

No component code, styling, data logic, or route paths change. `/customers`, `/leads`, `/reservations` still render the same lists, and `/customers/$id`, `/leads/$id`, `/reservations/$id` will now actually render their detail pages.

The router regenerates `routeTree.gen.ts` automatically after the rename.
