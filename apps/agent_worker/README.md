# Agent Worker

> Lives at `apps/agent_worker/` in the monorepo, alongside `apps/workbench-api` (NestJS) and `apps/web` (Next.js).

## What this is

The Agent Worker is a standalone TypeScript daemon — no framework, no HTTP surface beyond a
liveness probe — that turns a completed S3 upload into a structured, reviewable referral. Its
lifecycle is:

**pull an upload message → claim (Redis) → publish `PROCESSING` → download the PDF → Gemini → publish a terminal result (`COMPLETED` / `REJECTED` / `FAILED`) → delete the upload message.**

It has no routes, no sessions, no knowledge of who's connected to the frontend, and no opinion
about how results reach the browser. Crucially, it **never touches Postgres**: it holds no
database credentials. The Workbench API is the only writer to the database — the worker
communicates results by publishing to the status-update SQS queue, and the API applies the
idempotent DB transition (which in turn fires `LISTEN`/`NOTIFY` → SSE).

## Why not NestJS or Express

Both are frameworks built around handling inbound HTTP requests — routing, middleware, guards,
a request/response lifecycle. This service never receives a request; it only makes outbound
calls (SQS, S3, Gemini, Redis) in a loop. Adding either would mean bootstrapping machinery this
component structurally doesn't use. The Workbench API is deliberately NestJS, where that
machinery earns its keep.

## Processing flow

1. Long-poll the **upload queue** (`WaitTimeSeconds: 20`) for S3 `ObjectCreated` notifications.
2. Parse the event to recover `bucket`, `key`, and the `referral_id` embedded in the key
   (`referrals/{clinic_id}/{referral_id}.pdf`).
3. **Claim** the referral with an atomic TTL'd Redis lock (`SET referral-claim:{id} NX EX
   {ttl}`). If another worker holds the claim, the message is skipped and deleted. The TTL
   (default 600s, `REFERRAL_CLAIM_TTL_SECONDS`) must exceed worst-case extraction time; it also
   auto-releases the claim if the worker crashes mid-flight.
4. Publish a `PROCESSING` status event to the status-update queue (the dashboard shows the job
   in flight).
5. Resolve the extraction schema from the cached `referral:{id}` projection written by the
   Workbench API at creation (referral-specific override → clinic default → null, meaning the
   default LLM field set). The resolved schema id is carried on the `COMPLETED` event.
6. Download the PDF bytes from S3 and run a cheap pre-check (valid PDF, sane size). Fails
   here → publish `REJECTED` with the reason.
7. Call Gemini with the PDF and the resolved schema, requesting the nested
   `{ value, page_number, bounding_box }` shape per field.
8. Publish the terminal event to the status-update queue:
   - `COMPLETED` with `extractedPayload` + `patientName` + resolved schema id,
   - `REJECTED` with the reason (content-level rejection, e.g. not a valid referral),
   - `FAILED` with the error message on any unexpected exception.
9. Delete the upload message **only after** the terminal publish succeeds. On failure the
   claim is released and the message redelivers after the SQS visibility timeout (at-least-once
   end-to-end).

## Status values this service publishes

| Status | Meaning |
|---|---|
| `PROCESSING` | Claimed off the queue, work in progress |
| `COMPLETED` | Extraction succeeded, `extractedPayload` populated |
| `FAILED` | System/processing error (timeout, malformed response) — retryable |
| `REJECTED` | Content-level rejection (not a valid referral, unreadable) — not retried |

`PENDING` is set by the Workbench API at creation. The DB status transitions are
applied by the Workbench API from these events (`PENDING → PROCESSING → COMPLETED`
directly, or `→ REJECTED`/`FAILED`), so the worker never performs a DB write.

## Bounding boxes: graceful degradation

`bounding_box` is treated as **nullable per field**. If Gemini returns a confident location,
the review UI can highlight it; if not, the extracted value still displays normally, just
without click-to-highlight for that field. A failure to ground one field never fails the
whole extraction.

## Environment variables

| Variable | Purpose |
|---|---|
| `AWS_REGION` | Region for SQS + S3 clients |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Scoped IAM credentials (S3 read, SQS consume + publish) |
| `SQS_QUEUE_URL` | Upload queue to poll (S3 `ObjectCreated` events) |
| `SQS_STATUS_UPDATE_URL` | Status-update queue to publish `PROCESSING` / `COMPLETED` / `REJECTED` / `FAILED` events |
| `S3_BUCKET_NAME` | Bucket holding uploaded referral PDFs |
| `REDIS_URL` | Redis used for the claim lock and schema metadata reads |
| `GEMINI_API_KEY` | Gemini multimodal API key |
| `GEMINI_MODEL` | Gemini model name |
| `REFERRAL_CLAIM_TTL_SECONDS` | Claim-lock TTL in seconds — must exceed worst-case extraction time (default: 600) |
| `MAX_CONCURRENT_MESSAGES` | Max messages pulled per long-poll receive (default: 5) |
| `POLL_WAIT_SECONDS` | Long-poll duration per receive (default: 15) |
| `HEALTHCHECK_PORT` | Liveness probe port (default: 8002) |

## Project structure

```
apps/agent_worker/
  src/
    index.ts                           # entry point, wiring, SIGINT/SIGTERM shutdown
    config/env.config.ts               # zod-validated environment config
    clients/
      aws/sqs-consumer.service.ts      # upload-queue polling (long-poll + retry backoff)
      aws/sqs-status-update-publisher.service.ts  # publishes status events
      aws/s3.service.ts                # PDF download helper
      ai/gemini-client.service.ts      # Gemini multimodal extraction call
      cache/redis.service.ts           # claim lock + cached schema metadata reads
    extraction/
      referral-extraction.service.ts   # orchestration: claim → extract → publish
      pre-validator.service.ts         # cheap PDF sanity checks
      payload-normalizer.ts            # normalizes LLM output + bounding boxes
      extraction-schema.ts             # builds the Gemini response schema
      extraction-logger.ts             # per-job result logging
    server/healthcheck.ts              # node:http liveness endpoint
    types/                             # event / job / extraction types
  package.json
  tsconfig.json
```

There is no `Dockerfile` here — the shared `docker/Dockerfile.dev` builds the workspace, and
`docker-compose.yml` runs it with the source bind-mounted and hot-reloaded via `tsx watch`.

## Running locally

```bash
# From the repo root — the worker loads .env from the repo root automatically.
npm run dev:worker
```

Requires the SQS queues and S3 bucket to exist and be wired together (S3 bucket → SQS
upload-queue notification), a reachable Redis (`REDIS_URL`), and the Workbench API running
(which owns the database writes). The worker publishes results to `SQS_STATUS_UPDATE_URL`; the
Workbench API consumes that queue.

The worker holds no listening port by default; `server/healthcheck.ts` starts a one-route
`node:http` server purely to answer the orchestrator liveness probe (`/healthz`).

## Assumptions & limitations

- Single process per claim lock is inherent to the TTL'd lock; horizontal scaling is "run more
  copies of this same process" — SQS consumer competition plus the Redis claim distributes work
  with no coordination logic needed in the worker.
- No built-in rate limiting against the Gemini API beyond SQS's natural backpressure (a slow
  consumer just means messages queue longer, not that anything is dropped).
- Bounding-box grounding accuracy on low-quality fax scans hasn't been validated at scale;
  treated as best-effort per the graceful-degradation approach above, not a guarantee.
