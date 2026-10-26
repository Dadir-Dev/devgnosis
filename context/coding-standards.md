# DevGnosis Coding Standards

> The engineering conventions for DevGnosis. This document implements the technical decisions in [the project overview](./project-overview.md); if a conflict appears, update both documents in the same change or explicitly record the decision.

## Guiding rules

1. **Secure ownership first.** Every protected read and mutation is scoped to the authenticated server-side user.
2. **Prefer the server.** Use React Server Components for reads and keep the client boundary as small as practical.
3. **Validate at every boundary.** External data—forms, route requests, webhooks, uploads, environment variables, and AI inputs—is parsed with Zod before use.
4. **Keep data portable and explicit.** Store source Markdown/text, object keys, and structured metadata; do not make rendered HTML or public storage URLs the canonical record.
5. **Accessible, responsive, and fast are acceptance criteria**, not polish deferred to the end.

## TypeScript

- Enable TypeScript `strict` mode. Do not weaken compiler checks to silence an error.
- Do not use `any`. Use `unknown` at trust boundaries, then narrow it with Zod or a type guard.
- Prefer inference for local implementation details; declare explicit exported function return types, public component props, shared data contracts, and non-obvious values.
- Use `type` for unions, mapped/utility types, and data shapes; use `interface` when declaration merging or extension is useful. Do not introduce a type solely because a value can be inferred.
- Keep database-inferred types close to the schema and derive them with Drizzle helpers where useful. Do not duplicate database table shapes as manually maintained types.
- Use `satisfies` for configuration objects and `as const` for immutable literal maps. Avoid unsafe type assertions; if one is unavoidable, isolate and explain it.
- Use `import type` for type-only imports.

## Naming and modules

| Thing | Convention | Example |
| --- | --- | --- |
| React component / type | PascalCase | `ItemCard`, `ItemCardProps` |
| Function / variable / hook | camelCase | `createItem`, `useItemFilters` |
| Constant | SCREAMING_SNAKE_CASE only for true module constants | `MAX_UPLOAD_BYTES` |
| Files and folders | kebab-case, except component files may be PascalCase | `item-service.ts`, `ItemCard.tsx` |
| Database tables / columns | `snake_case` in PostgreSQL, mapped to camelCase in TypeScript | `owner_id` → `ownerId` |
| Route segment | lowercase kebab-case | `/items/snippets` |

Avoid barrel files that blur server/client boundaries or cause circular imports. Prefer direct imports from the owning module.

## Project organization

```text
src/
  app/                    # App Router routes, layouts, Route Handlers
  actions/                # UI-facing Server Actions, grouped by feature
  components/
    ui/                   # shadcn/ui primitives and thin local adaptations
    item/                 # feature components
    collection/
  db/
    schema/               # Drizzle table definitions and relations
    migrations/           # generated, reviewed SQL migrations
    queries/              # composable read queries when not in a service
  features/               # feature services, schemas, policies, and helpers
  lib/                    # framework-agnostic utilities and integrations
  types/                  # truly cross-feature public types only
  test/                   # shared test helpers and fixtures
```

- Co-locate feature-specific Zod schemas, types, tests, and server logic when doing so improves discoverability.
- Put business rules in feature services/policies, not in React components, pages, or raw Route Handlers.
- Keep secrets and server-only integrations behind server-only modules. Add `import "server-only"` to modules that must never enter a client bundle.
- Do not import server modules into a client component. Pass serialized, minimal view models as props instead.

## React and Next.js

### Component boundaries

- Use functional components only; class components are not permitted.
- Use Server Components by default. Add `'use client'` only for browser APIs, event handlers, local interactive state, or client-only hooks.
- Place the client boundary as low in the tree as possible. A page or layout is not made client-side merely because one child is interactive.
- Keep components focused. Extract repeated stateful behavior into a custom hook and repeated UI into a component once it has a clear reuse boundary.
- Use `next/link` for internal navigation and `next/image` where it fits the image delivery model. Do not pass arbitrary remote URLs to `next/image` without an explicit image policy.
- Treat loading, error, empty, and unauthorized states as designed states. Implement route-level `loading.tsx`, `error.tsx`, and `not-found.tsx` where appropriate.

### Data reads and mutations

- Fetch authenticated data directly in Server Components through an owner-scoped query/service. Do not fetch the app’s own Route Handler from a Server Component.
- Use **Server Actions** for small, UI-initiated mutations such as creating an item, adding a tag, or toggling a favorite.
- Use **Route Handlers** (`route.ts`, not legacy “API routes”) for Stripe webhooks, signed upload/download URLs, integration callbacks, endpoints that require explicit HTTP behavior, and future external clients.
- Long-running work is not performed in a request that the browser waits on. Persist/enqueue the work, return promptly, and process AI/export work through an async job mechanism when introduced.
- Server Actions and Route Handlers must authenticate, authorize, validate input, invoke a service, and return a typed result. They must not contain duplicated business rules.
- Revalidate only the affected paths/tags after a successful mutation. Use optimistic UI only when the rollback path is clear.

### Route conventions

- Use dynamic routes for item and collection detail pages. Collection URLs use the stable, per-owner `slug`; it is a locator, never an authorization mechanism.
- Keep filters and pagination state in the URL where it improves sharing, refresh behavior, and back/forward navigation.
- Prefer `redirect()`/`notFound()` from the server over client-side permission redirects.

## Validation and contracts

- Define a Zod schema for each command/input boundary: forms, search filters, Route Handler bodies/query params, uploads, webhook payloads after signature verification, and AI inputs.
- Validate and normalize on the server even if the client form validates too.
- Never trust client-supplied `userId`, plan status, ownership flags, storage keys, item type permissions, or file metadata.
- Use discriminated unions for typed item content (`text`, `url`, `file`) so that required and forbidden fields are clear.
- Validate `content_kind` against the selected item type. Text requires content; links require a normalized URL; files require validated server-side metadata.
- Prefer structured errors with a stable error code and a safe user-facing message. Do not expose database, provider, or stack details to the client.

## Database: Neon PostgreSQL and Drizzle

- Use **Drizzle ORM** for application database access. Prisma must not be added to this project.
- Define table schemas, relations, constraints, and indexes in `src/db/schema/`. Use PostgreSQL `snake_case`; use camelCase property names in TypeScript.
- Generate, review, and commit Drizzle migrations for every schema change. Migrations are immutable once shared or deployed.
- **Never use `drizzle-kit push` / `db push` against shared or production databases.** Do not modify a shared database directly.
- Apply the same reviewed migration artifacts in development, CI, staging, and production. Run migration status/consistency checks in CI before deployment.
- Use transactions for multi-step invariants, such as an item plus its collection/tag join rows, and make webhook processing idempotent.
- Add indexes based on access patterns. Baseline indexes include owner-plus-updated timestamp, owner-plus-type, join-table composite keys, and the GIN index that supports full-text search.
- Enforce structural invariants with foreign keys, unique constraints, and `CHECK` constraints where possible; enforce cross-table ownership invariants in a transaction/service layer.
- Seed system item types through a deterministic, idempotent seed/migration. End users cannot rename or delete them.
- Custom item types are deferred beyond the MVP. The schema may support their future ownership rules, but no MVP UI or API should expose them.

### Ownership policy

- Resolve the authenticated user on the server for every protected operation.
- Every item, collection, tag, subscription, and join-table lookup is owner-scoped. Do not load by an unscoped ID then check ownership later.
- Verify that both records belong to the same owner before creating an item–collection or item–tag association.
- Do not rely on client-side filtering, URL slugs, or hidden fields for authorization.

## Authentication, billing, and entitlements

- Use Better Auth for email/password and GitHub/Google OAuth. Keep its managed tables/contracts distinct from app profile and subscription data.
- Treat Stripe webhooks as the billing-event source of truth. Verify webhook signatures before parsing the event; persist event identifiers and process events idempotently.
- Derive effective access from plan and subscription status, not a lone mutable `isPro` boolean.
- Enforce Free limits and Pro-only capabilities in server-side services/handlers. UI gating improves clarity; it is not authorization.
- A development entitlement bypass may exist only outside production and must fail closed in production.

## Files and Cloudflare R2

- R2 stores binary objects; Postgres stores the canonical object key and metadata. A permanent public URL is never the source of truth.
- Issue short-lived, authorization-checked signed URLs for uploads and downloads. Do not proxy large uploads through the application server unless there is a specific requirement.
- Validate file size, MIME type, and allowed extension on the server. Do not trust browser-provided MIME values alone.
- Use owner-prefixed, non-guessable object keys. Do not derive a key from a user-controlled filename.
- Deleting an item and its object is a controlled workflow: preserve database/object consistency, support the product’s eventual deletion policy, and make retries safe.
- File and image uploads are Pro-only; enforce that before signing an upload.

## Search, AI, and async work

- Search is owner-scoped PostgreSQL full-text search over title, description, and text content, with tags/type filters and cursor pagination. Preserve the database ranking rather than inventing client-side ranking.
- Do not add Redis to the MVP without measured need. It may be introduced for a demonstrated cache or rate-limit requirement.
- AI runs only after the primary item save succeeds. It is Pro-only, metered, retryable, cancelable where supported, and never blocks saving an item.
- Send the minimum user-authorized content needed to the AI provider. Validate AI input and structured output; label generated content and require the user to apply suggestions explicitly.
- Never execute user-submitted code as part of code explanation. Do not log prompt secrets or full sensitive content by default.
- Isolate provider-specific model identifiers and SDK calls in an adapter; confirm the deployed model identifier during integration rather than scattering string literals.

## Tailwind CSS v4 and UI

> **Critical:** DevGnosis uses Tailwind CSS v4’s CSS-first configuration.

- Do **not** create `tailwind.config.ts` or `tailwind.config.js`. Theme configuration belongs in `src/app/globals.css` using `@theme` and CSS custom properties.
- Use Tailwind utilities for component styling and shadcn/ui primitives where they fit. Extend primitives through composition and variants rather than copying implementation code indiscriminately.
- Do not use ad hoc inline `style` props. An exception is a genuinely runtime-derived visual value that cannot be expressed with existing tokens/utilities; keep it typed, sanitized, and documented.
- Use semantic CSS variables/tokens for themeable color, spacing, radius, and shadow values. Do not scatter raw hex values through components.
- Dark mode is the default; light mode is a supported, persistent preference. Check contrast in both themes.
- Type colors are product tokens. Use their accent/tint variants deliberately; do not use color as the only indicator of item type or state.

### Accessibility and interaction

- Start from accessible shadcn/Radix primitives; retain labels, keyboard behavior, focus management, and ARIA semantics when composing them.
- All functionality must be keyboard operable. Preserve the documented shortcuts and avoid intercepting shortcuts while a user is editing text.
- Provide visible focus states, semantic headings, form labels/error associations, accessible names for icon-only controls, and meaningful empty/loading states.
- Respect `prefers-reduced-motion`; motion must not be required to understand a result or complete an action.
- Test the sidebar/drawer, dialogs, quick-create flow, and item detail drawer at narrow mobile widths as well as desktop.

## Errors, observability, and user feedback

- Anticipate expected failures with validation results and domain errors. Reserve `try/catch` for operations that can actually throw; do not blanket-wrap every function.
- Server Actions return a typed, serializable result such as `{ ok: true, data } | { ok: false, error: { code, message, fieldErrors? } }`.
- Route Handlers return appropriate HTTP status codes and a documented error response shape.
- Show user-safe feedback with toasts for background actions and inline errors for invalid forms. Do not toast an error that has no clear recovery context.
- Log server errors with request/context IDs while redacting tokens, credentials, full prompt content, and signed URLs. Monitoring must never become a source of user data leakage.

## Testing and quality gates

- Use **Vitest** for unit and service tests. Co-locate test files with their subject as `*.test.ts` or `*.test.tsx`.
- Unit-test Zod schemas, entitlement rules, ownership policies, item content validation, query/service behavior, and webhook idempotency. Mock external boundaries (R2, Stripe, Better Auth, AI provider), not the business rule being tested.
- Add component tests for behavior that is difficult to prove through unit tests, especially keyboard and form accessibility. Add end-to-end coverage for critical user journeys once a browser test runner is configured.
- Use `vi.mock()` for external dependencies and `vi.useFakeTimers()` for time-dependent behavior. Reset mocks and global state between tests.
- Before a pull request, run formatting, linting, type checking, unit tests, and migration/schema checks. CI must run the same checks.
- No commented-out code, unused imports, unused variables, dead feature flags, or ignored errors. Delete obsolete code; source control preserves history.
- Aim for functions under roughly 50 lines when that improves clarity. Extract coherent operations, but do not fragment straightforward code merely to meet a number.

## Pull request checklist

- [ ] The change has server-side authentication, authorization, and Zod validation where applicable.
- [ ] Ownership and entitlement rules are enforced outside the UI.
- [ ] A database change includes a reviewed Drizzle migration, relevant indexes/constraints, and tests.
- [ ] File, billing, webhook, or AI changes follow their applicable security boundary rules.
- [ ] Loading, empty, error, keyboard, mobile, dark-mode, and light-mode states were considered.
- [ ] Tests and quality gates pass; no secrets, signed URLs, or user content were added to logs/fixtures.
- [ ] `project-overview.md` was updated if this changes a documented architectural or product decision.
