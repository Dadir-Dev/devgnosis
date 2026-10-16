# Current Feature

<!-- Feature name and short description -->

**Dashboard UI — Phase 3**
Build out the dashboard main area: recent collections, pinned items, the 10 most recent items, and four summary stats cards. Spec: `context/features/dashboard-phase-3-spec.md`.

## Status

<!-- Not Started | In Progress | Completed -->
In Progress

## Goals

<!-- Goals and requirements -->

- The main area to the right
- Recent collections
- Pinned Items
- 10 Recent items
- 4 stats cards at the top for number of items, collections, favorite items and favorite collections (not in screenshot)

## Notes

<!-- Additional notes or comments -->

- Phase 3 of 3 for the dashboard UI layout.
- Use `context/screenshots/dashboard-ui-main.png` as the visual reference.
- Import data directly from `src/lib/mock-data.ts` (items, collections, `dashboardStats`, etc.) until the database is implemented.

## History

<!-- Keep a record of changes and updates. Earliest to latest -->

**Initial Setup**
Next.js 16, Tailwind CSS, TypeScript configuration(Completed).

**Dashboard UI — Phase 1**
Completed on branch `feat/dashboard-phase-1`: initialized ShadCN UI (Button, Input), added the `/dashboard` route with a dashboard layout, dark mode by default, a display-only top bar (search + New item), and Sidebar/Main placeholders. Lint, type-check, and production build pass. Status: Completed.

**Dashboard UI — Phase 2**
Completed on branch `feat/dashboard-phase-2`: replaced the sidebar placeholder with a collapsible desktop rail driven by a `SidebarProvider` client context, added item-type links to `/items/TYPE` (with type icons/colors and PRO badges), favorite and most-recent collection sections, a user avatar area at the bottom, a top-bar drawer trigger, and a Radix Dialog drawer that is always used on mobile. Seeded two favorite collections in the mock data so the favorites section renders. Lint, type-check, and production build pass. Status: Completed.
