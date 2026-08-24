# Client

> Lives at `client/` in the monorepo, alongside `workbench-api/` and `worker-agent/`.

## What this is

The Next.js frontend for the Plena Referral Extraction Workbench: clinic auth, referral
upload, extraction schema management, and the review interface — a referral PDF next to
its extracted fields, with click-to-highlight sourced from `page_number` + `bounding_box`.

## Technologies

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Shadcn UI (Radix primitives underneath) |
| API Client | `openapi-fetch` |
| Code Generation | `openapi-typescript` — types generated from the WorkBench API's own OpenAPI document, the same one Scalar renders at `/reference` |
| Client State | Zustand (persisted stores) |
| Server State / Caching | `next/cache` (`unstable_cache`, `revalidateTag`) |
| Real-time | Native `EventSource` (SSE) against `/referrals/:id/stream` |
| PDF Rendering | `pdfjs-dist` / `react-pdf` — renders the referral and draws the bounding-box highlight overlay |

## How data flows here

- Server Components and Server Actions call the typed REST client (`openapi-fetch`)
  directly — never `fetch` with a hand-written URL string, so a backend contract change
  surfaces as a type error here, not a runtime bug.
- Anything cacheable is wrapped in `unstable_cache` with a tag; mutations that should
  invalidate it call `revalidateTag`/`revalidatePath` from the Server Action, not from
  the client.
- Referral status changes arrive over a single `EventSource` connection per open referral
  detail view — no polling, no manual refetch loop.
- Zustand only holds state that has **no server source of truth**: the currently selected
  field, the active highlight, transient upload progress. Anything that originated on the
  server is fetched and cached through `next/cache`, never duplicated into a store.

## Running locally

```bash
cd client
cp .env.example .env   # WORKBENCH_API_URL, etc.
npm install
npm run codegen         # runs openapi-typescript against the running WorkBench API
npm run dev
```

`workbench-api` needs to be running and reachable for the codegen step, since it generates
types from the live OpenAPI document rather than a checked-in schema file.

## Assumptions & limitations

- Form validation library isn't committed yet — Zod is the natural fit given the
  TypeScript-first stack and would pair cleanly with Server Actions, but this hasn't been
  decided, so `server-actions/` currently validates by hand where it validates at all.
- No i18n/locale strategy has been scoped. The folder structure (see
  `frontend-file-structure.md`) leaves room for it in `assets/` and `public/` without
  assuming it's needed for the 2-day build.