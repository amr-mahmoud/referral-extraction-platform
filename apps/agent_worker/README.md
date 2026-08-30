# Agent Worker

> Lives at `worker-agent/` in the monorepo, alongside `workbench-api/` (NestJS) and `client/` (Next.js).

## What this is

The Agent Worker is a standalone TypeScript process — no framework, no HTTP surface — that
turns a completed S3 upload into a structured, reviewable referral. Its entire lifecycle is:

**pull a message → download a PDF → call Gemini → write a row → delete the message.**

It has no routes, no sessions, no knowledge of who's connected to the frontend, and no
opinion about how results reach the browser. It updates Postgres; the WorkBench API
(via `LISTEN`/`NOTIFY` and SSE) is what turns that write into something the client sees.

## Why not NestJS or Express

Both are frameworks built around handling inbound HTTP requests — routing, middleware,
guards, a request/response lifecycle. This service never receives a request; it only makes
outbound calls (SQS, S3, Gemini, Postgres) in a loop. Adding either would mean bootstrapping
machinery this component structurally doesn't use. The WorkBench API is deliberately NestJS,
where that machinery earns its keep — the split is a judgment call about matching the tool
to what each service actually does, not an oversight of the assignment's "NestJS" stack line.

## Processing flow

1. Long-poll SQS (`WaitTimeSeconds: 20`) for S3 `ObjectCreated` event notifications.
2. Parse the event to recover `bucket`, `key`, and the `referral_id` embedded in the key
   (`referrals/{clinic_id}/{referral_id}.pdf`) — no extra DB lookup needed to identify the row.
3. Set `Referral.status = PROCESSING`.
4. Run a cheap pre-check: valid PDF, page count and size sane, quick "is this a referral"
   pass. Fails here → `status = REJECTED`, `error_message` set, message deleted, done.
5. Download the PDF bytes from S3.
6. Resolve the extraction schema for this referral: referral-specific override → clinic's
   `default_extraction_schema_id` → null (LLM default field set). The resolved id is what
   gets persisted on the referral row — not just whatever was requested at upload time.
7. Call Gemini 2.5 multimodal with the PDF and the resolved schema, requesting the nested
   `{ value, page_number, bounding_box }` shape per field.
8. Write `extracted_payload` (JSONB) and `status = COMPLETED` to Postgres.
9. Delete the SQS message **only after** the DB write succeeds.
10. On any exception in steps 4–8: write `status = FAILED` with `error_message`, and leave
    the message alone — SQS's visibility timeout will redeliver it, up to `maxReceiveCount`,
    after which it lands in the DLQ for manual inspection instead of looping forever.

## Status values this service writes

| Status | Meaning |
|---|---|
| `PROCESSING` | Picked up off the queue, work in progress |
| `COMPLETED` | Extraction succeeded, `extracted_payload` populated |
| `FAILED` | System/processing error (timeout, malformed response, DB issue) — retryable |
| `REJECTED` | Content-level rejection (not a valid referral, unreadable) — not retried |

(`AWAITING_UPLOAD` and `PENDING` are set by the WorkBench API before this service ever
sees the referral.)

## Bounding boxes: graceful degradation

`bounding_box` is treated as **nullable per field**. If Gemini returns a confident location,
the review UI can highlight it; if not, the extracted value still displays normally, just
without click-to-highlight for that field. A failure to ground one field never fails the
whole extraction.

## Environment variables

| Variable | Purpose |
|---|---|
| `AWS_REGION` | Region for SQS + S3 clients |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Scoped IAM credentials (S3 read, SQS consume only) |
| `SQS_QUEUE_URL` | Queue to poll |
| `S3_BUCKET` | Bucket holding uploaded referral PDFs |
| `DATABASE_URL` | Postgres connection string (same schema as `workbench-api`) |
| `GEMINI_API_KEY` | Gemini 2.5 multimodal API key |
| `MAX_CONCURRENT_MESSAGES` | Number of independent polling lanes — i.e. sustained concurrency (default: 10) |
| `POLL_WAIT_SECONDS` | Long-poll duration per lane (default: 15) |

## Project structure

```
worker-agent/
  src/
    index.ts        # entry point, poll loop
    extractor.ts     # schema resolution + Gemini call
    s3.ts            # download helper
    db.ts            # Prisma client, status writes
    healthcheck.ts   # optional node:http liveness endpoint for container orchestration
  package.json
  tsconfig.json
  Dockerfile
  .env.example
```

`db.ts` imports the same generated Prisma client as `workbench-api` (shared `prisma/schema.prisma`
at the repo root) — one schema, one source of truth, no duplicated model definitions between
the two services.

## Running locally

```bash
cd worker-agent
cp .env.example .env   # fill in AWS creds, queue URL, bucket, DB URL, Gemini key
npm install
npm run dev
```

Requires the SQS queue and S3 bucket to already exist and be wired together (see the root
`infra/setup-aws.sh`), and Postgres reachable at `DATABASE_URL` (the root `docker-compose.yml`
starts it if you're running everything locally).

The worker holds no listening port by default. If deploying to an orchestrator that expects
a liveness probe, `healthcheck.ts` starts a one-route `node:http` server (not Express) purely
to answer `200 ok`.

## Assumptions & limitations

- Single-instance polling for the demo; horizontal scaling is "run more copies of this same
  process," since SQS consumer competition handles message distribution for free — no
  coordination logic needed in the worker itself.
- No built-in rate limiting against the Gemini API beyond SQS's natural backpressure (a slow
  consumer just means messages queue longer, not that anything is dropped).
- Bounding-box grounding accuracy on low-quality fax scans hasn't been validated at scale;
  treated as best-effort per the graceful-degradation approach above, not a guarantee.