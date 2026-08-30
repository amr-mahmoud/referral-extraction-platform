# Web (Next.js)

> Lives at `apps/web/` in the monorepo, alongside `apps/workbench-api` (NestJS) and `apps/agent_worker` (SQS → Gemini extraction).

## What this is

The Next.js frontend for the Plena Referral Extraction Workbench: clinic auth, referral
upload, extraction schema management, and the review interface — a referral PDF next to
its extracted fields, with click-to-highlight sourced from `page_number` + `bounding_box`.

## Technologies

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (shadcn-style primitives via `class-variance-authority` + `tailwind-merge`) |
| API Client | `openapi-fetch` + `axios` |
| Code Generation | `openapi-typescript` — types generated from the WorkBench API's own OpenAPI document, the same one Scalar renders at `/reference` |
| Real-time | Native `EventSource` (SSE), proxied through `app/api/referrals/stream` to the WorkBench API's `GET /referrals/stream` |
| PDF Rendering | `react-pdf` — renders the referral and draws the bounding-box highlight overlay |

## How data flows here

- Server Components, Server Actions, and client code call the typed REST client
  (`openapi-fetch` / `axios`) against the generated types — a backend contract change
  surfaces as a type error here, not a runtime bug.
- Referral status changes arrive over a single `EventSource` connection
  (`/api/referrals/stream`, proxied to the WorkBench API), consumed by
  `use-referral-status-stream` — no polling, no manual refetch loop.
- Auth: the API returns a JWT bearer token on login; a Server Action persists it in an
  httpOnly cookie, and server actions / the SSE proxy forward it as the bearer token.
- Uploads go **directly to S3** via the presigned PUT URL the API returns — the browser never
  sends PDF bytes through the app server.

## Running locally

```bash
# From the repo root
npm run dev:web
```

`workbench-api` must be running and reachable for codegen, since the app generates its API
types from the live OpenAPI document (`npm run codegen-api` at the repo root / `make codegen-api`).

## Assumptions & limitations

- No i18n/locale strategy has been scoped.
- Review-screen highlighting is best-effort: fields without a grounded bounding box render
  normally but aren't click-to-highlight.
