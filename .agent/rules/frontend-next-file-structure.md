---
trigger: always_on
---

# Frontend File Structure

> Intended for `Rules` / project conventions. Adapted from a prior GraphQL + Apollo
> template — the two folders whose *responsibility* changes are `server-actions/` and
> `types/` (GraphQL mutations/models → REST calls/OpenAPI-generated models). Everything
> else translates unchanged, since it was never GraphQL-specific to begin with.

## 1. Folder Structure — Frontend

- **`hooks/`** — Reusable logic for UI behavior and state synchronization between views
  and underlying data. Use even when logic isn't repeated yet — the hook name documents
  the underlying behavior on its own (e.g. `useHighlightSync`, `useReferralStatusStream`).

- **`server-hooks/`** — `"use client"` React wrappers that consume Server Actions,
  managing form state, loading transitions (`isPending`), and side effects (toast
  notifications) so UI components stay pristine.

- **`server-actions/`** — Strictly `"use server"` functions that act as secure Node.js
  middlemen: receive client data, call the **typed REST client (`openapi-fetch`)** against
  the WorkBench API, and trigger Next.js cache revalidation (`revalidatePath`,
  `revalidateTag`).
  *(This is the one folder whose backend integration changed — was GraphQL mutations via
  `graphql-request`, is now typed REST calls via `openapi-fetch`. The responsibility —
  client-in, mutate-backend, revalidate-cache — is identical.)*

- **`managers/`** — Core business rules and domain logic isolated for testability and
  reuse across views (e.g. `bounding-box.manager.ts` scaling a normalized
  `{ xmin, ymin, xmax, ymax }` from the extracted payload to the actual rendered PDF page
  size in pixels).

- **`store/`** — Global application state where domain-specific *client* data and its
  mutation logic are centralized (e.g. currently selected field, active highlight,
  in-flight upload progress). Server-sourced data does not live here — see `next/cache`.

- **`constants/`** — Fixed values, configuration tokens, and shared static definitions
  used globally (status labels/colors, field-type enums, SSE event names).

- **`routes/`** — Path configurations and accessibility rules determining how users
  navigate between application states (e.g. which routes require an authenticated
  clinic session).

- **`layouts/`** — High-level structural skeletons providing a consistent look and feel
  across groups of pages (`dashboard-layout.tsx`, `auth-layout.tsx`).

- **`apps/`** — Primary entry points for specific URL routes that aggregate components
  and data into a complete view. Keeps `app/**/page.tsx` thin — a page imports and
  renders its corresponding `apps/` entry rather than assembling the view inline.

- **`shared/`** — Reusable UI components (buttons, inputs, modals) built to be
  domain-agnostic, typically wrapping/extending Shadcn primitives.

- **`features/`** — Feature-specific component modules organized by domain:
  `features/referrals/`, `features/review/`, `features/extraction-schemas/`,
  `features/auth/`.

- **`assets/`** — Internal static resources compiled by the bundler: fonts, SVG icons,
  global theme CSS variables. Locale-specific assets go here if/when i18n is scoped.

- **`public/`** — Unprocessed static files served directly at the root path: favicon,
  `robots.txt`, and (if added later) i18n translation dictionaries.

- **`types/`** — Global TypeScript definitions: shared system interfaces plus
  **auto-generated OpenAPI models**, organized by domain (e.g.
  `types/referrals/referral.ts`).
  *(Was GraphQL models from `graphql-codegen`; now `openapi-typescript` output, generated
  from the WorkBench API's own OpenAPI document rather than a `.graphql` schema.)*

- **`client/`** — Centralized configuration for network clients: the **`openapi-fetch`**
  instance and base URL, plus the `EventSource`/SSE wrapper. Handles auth header
  injection and any global request interceptors in one place.
  *(Was Apollo/Axios configuration; same responsibility — one place that knows how to
  reach the backend — different client underneath.)*

---
