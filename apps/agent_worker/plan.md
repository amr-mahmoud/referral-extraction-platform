# Plena Referral Extraction Platform — Agent Worker Architecture & Implementation Plan

This document outlines the complete architectural design and end-to-end implementation plan for the **Agent Worker** daemon (`apps/agent_worker`), adhering to Clean Architecture principles, single-responsibility separation, and high-throughput reliability constraints specified in [product_solution_design.md](file:///Users/amrhazem/Desktop/referral-extraction-platform/docs/product_solution_design.md) and [README.md](file:///Users/amrhazem/Desktop/referral-extraction-platform/apps/agent_worker/README.md).

The worker is deliberately **lean**: no NestJS, no DDD ports/repositories, no HTTP framework. It is a plain Node + TypeScript daemon (driven by `tsx` for dev, `tsc` for build) that only makes outbound calls (SQS, S3, Gemini, Postgres, Redis) in a loop. Everything below must stay within that budget — a file earns its place by being load-bearing, not by filling a layer.

---

## 1. System Overview & Processing Lifecycle

The Agent Worker is an autonomous, event-driven TypeScript daemon designed to process completed S3 referral uploads with zero inbound HTTP attack surface.

```mermaid
flowchart TD
    A["AWS SQS Queue\n(S3 ObjectCreated Events)"] -->|Long-poll 20s| B["SQS Consumer Loop\n(sqs-consumer.service.ts)"]
    B -->|Parse S3 Key & referral_id| C["Extraction Pipeline Orchestrator\n(referral-extraction.service.ts)"]
    C -->|Claim: conditional status = PROCESSING| D["Postgres / Prisma Service\n(prisma.service.ts)"]
    C -->|Fetch Schema & File Metadata (Redis, DB fallback)| E["Redis Cache Service\n(redis.service.ts)"]
    C -->|Download PDF bytes| F["S3 Storage Service\n(s3.service.ts)"]
    C -->|Sanity Pre-check| G["Pre-Extraction Validator\n(pre-validator.service.ts)"]
    G -->|Content-level rejection| H["Set status = REJECTED\nDelete SQS Message"]
    G -->|Valid PDF| I["Gemini AI Client\n(gemini-client.service.ts)"]
    I -->|Validate LLM output (zod)| J["Normalize Payload & Bounding Boxes\n(payload-normalizer.ts)"]
    J -->|Save extracted_payload + status = COMPLETED| D
    J -->|Add referral_id to Clinic Redis Set| E
    D -->|Postgres LISTEN/NOTIFY Trigger| K["workbench-api SSE stream"]
    J -->|Delete SQS Message on Success| B
    C -->|System error (retryable)| L["Set status = FAILED\nLeave message for visibility-timeout redelivery"]
```

---

## 2. Cross-Service Contracts (align with workbench-api & the shared Prisma schema)

These are the fixed contracts this service must obey. Everything else in the design is local. Do not invent alternative shapes here.

### 2.1 Referral status values
The worker writes exactly these statuses (all defined in the **shared** `prisma/schema.prisma` — extend it if a value is missing; never maintain a private copy):

| Status | Written by worker when | Message handling |
|---|---|---|
| `PROCESSING` | Job claimed off the queue | — |
| `COMPLETED` | Extraction + DB write succeeded | delete |
| `REJECTED` | Content-level rejection (not a referral, unreadable) — **not retried** | delete |
| `FAILED` | System/processing error (Gemini timeout, malformed response, DB issue) — retryable | leave (visibility timeout → DLQ) |

> **Required shared-schema change:** `REJECTED` does not currently exist in `enum ReferralStatus` (`prisma/schema.prisma:13`) or in `workbench-api/src/domain/referral/referral-status.value-object.ts`. It must be added to **both**, plus `ALLOWED_TRANSITIONS` (`PROCESSING → REJECTED`, terminal). This is a Postgres migration + a workbench-api change — the worker must not run against a DB that doesn't yet have the enum value.

### 2.2 `extracted_payload` JSONB shape
Persisted shape is an array of `ExtractedField` objects — exactly what workbench-api's `ReferralMapper.toDomain` re-validates on every read (`referral.mapper.ts:26-40`):

```jsonc
[
  {
    "value": "Jane Doe",                 // string
    "pageNumber": 1,                     // int, 1-indexed (page 1 = first page)
    "boundingBox": { "xmin": 10, "ymin": 20, "xmax": 90, "ymax": 40 } | null
  }
]
```

`boundingBox` is **nullable per field** (graceful degradation — a missing/confident-location failure never fails the whole extraction).

> **`pageNumber` is 1-indexed — hard contract, not a detail.** workbench-api's `ExtractedField` VO rejects `pageNumber < 1` (`extracted-field.value-object.ts:23`), and the API re-hydrates the stored JSONB through that VO on every read — persisting 0-indexed pages would make every `COMPLETED` referral throw `InvalidExtractedFieldError` on read. 1-indexed also matches pdf.js/react-pdf page numbering, so the review UI consumes it without offset math. Consequences for this service: the Gemini prompt must request **1-indexed** pages (the old `src/agent.ts` prompt says 0-indexed — do not carry that over), and `payload-normalizer.ts` validates `pageNumber` as `int ≥ 1` via zod. Satisfying the existing VO means **no workbench-api change is needed** for this contract.

### 2.3 Bounding-box shape — standardized, no translation
- The Gemini `responseSchema` emits the **canonical object shape directly** — `{ xmin, ymin, xmax, ymax }` (0–1000 normalized), identical to what the DB/API/UI consume (`bounding-box.value-object.ts` ctor order).
- Because the LLM emits the persisted shape, there is **no coordinate re-mapping** — `payload-normalizer.ts` only validates/sanitizes (range, min ≤ max) and nulls a malformed box. Do not reintroduce a `[ymin, xmin, ymax, xmax]` tuple anywhere.

### 2.4 Redis keys — who writes what
- `referral:{referral_id}` — **written by workbench-api, read-only for the worker.** Hash with fields `fileName` and `extractionSchema` (JSON string of `{ id, version, schemaDefinition: { key, label, description }[] }`, or `''` when the clinic has no default schema). Read in O(1); do not mutate. On a cache miss, fall back to Postgres (§4C.2) — never fail a job on a miss.
- `clinic:{clinic_id}:referrals` — **written by the worker** (`SADD` on completion). This is a forward-looking write for design-doc step 10's clinic secondary index: nothing in workbench-api reads it yet (`ClinicsController.listReferrals` is still `NotImplementedError`). Write it as specced so the API can consume it later without a worker change. Best-effort ordering: run it **after** the `COMPLETED` commit, and treat a SADD failure as log-and-continue, never job-failing — Postgres is the source of truth, and a Redis blip must not cause a redelivery of an already-committed job.

### 2.5 S3 key pattern
`referrals/{clinic_id}/{referral_id}.pdf` — parse `clinicId` and `referralId` from the key; no extra DB lookup needed to identify the row.

### 2.6 Environment variable names
Use the same names as `workbench-api` — `S3_BUCKET_NAME` (not `S3_BUCKET`). Full list in §4.A.

### 2.7 SQS message envelope
Expect the raw S3 `ObjectCreated` event JSON array in `body.Records` (`eventName`, `s3.bucket.name`, `s3.object.key`). Direct S3 → SQS is the only wiring in scope (no SNS).

### 2.8 At-least-once delivery & deduplication — no extra dedup store needed

SQS is at-least-once; duplicates come from duplicate S3 events or redelivery after a crash/visibility-timeout. `DeleteMessage` is permanent; the visibility timeout only governs in-flight invisibility and redelivery on failure. A message is visible to only one consumer at a time **while its visibility timeout is unexpired** — duplicates are sequential only if processing finishes within that window. Gemini calls take seconds to tens of seconds against a 30s SQS default, so the queue's `VisibilityTimeout` **must** exceed worst-case job latency (set to 180s, §6.1); otherwise the same message becomes visible mid-processing and a second consumer picks it up *simultaneously*.

**No "in-processing" Redis Set is needed.** The atomic conditional DB claim (§4C) already dedups: `updateMany` where `status in (AWAITING_UPLOAD, PENDING)` → `PROCESSING`; if `0` rows were claimed, the referral is already claimed/terminal, so the worker skips Gemini and deletes the message. Being a single atomic Postgres statement, it's a stronger lock than a Redis check-then-set (no race), needs no TTL/cleanup, and can't drift from the DB. It also covers the simultaneous-duplicate case: the loser's claim returns `0` *before* any Gemini call, so a duplicate costs one extra queue receive, not a duplicate extraction. Delete-after-commit makes extraction effectively-once. Deletes use the consumer's own receipt handle; a failed delete (e.g. a duplicate already deleted the message) is logged and tolerated, never retried.

**Accepted gaps:** (1) A crash between claim and completion leaves the referral stuck in `PROCESSING` and the redelivered message skipped-and-deleted — surfaced in the UI as a stuck row, recoverable via DLQ/manual reset; re-claiming stale `PROCESSING` rows by `updated_at` is a later refinement, out of scope. (2) If a job legitimately exceeds the 180s visibility window, the simultaneous-duplicate path above applies — safe for the DB (claim guard), wasteful for Gemini (one duplicate call). A `ChangeMessageVisibility` heartbeat during the Gemini call is the follow-up refinement, deliberately omitted to keep the consumer loop simple.

---

## 3. Directory & File Structure

Flattened on purpose: `clients/` holds raw infrastructure wrappers, `extraction/` holds pure pipeline logic, and files are named `*.service.ts` / `*.ts` without redundant `infrastructure/` / `services/` nesting.

```
apps/agent_worker/
├── src/
│   ├── config/
│   │   └── env.config.ts                     # Strict env parsing/validation via zod (fail fast at boot)
│   ├── types/
│   │   ├── sqs-message.types.ts              # S3 ObjectCreated event & SQS notification payload types
│   │   ├── extraction.types.ts               # Raw LLM output, normalized bounding box, persisted payload types
│   │   └── referral-job.types.ts             # Internal job context & result types
│   ├── clients/
│   │   ├── aws/
│   │   │   ├── s3.service.ts                 # S3 client: download PDF buffer
│   │   │   └── sqs-consumer.service.ts       # SQS client: long-poll loop, claim/delete, visibility timeout
│   │   ├── database/
│   │   │   └── prisma.service.ts             # Shared Prisma client; idempotent status writes
│   │   ├── cache/
│   │   │   └── redis.service.ts              # ioredis client; metadata read + clinic index update
│   │   └── ai/
│   │       └── gemini-client.service.ts      # @google/genai client (multimodal PDF + responseSchema)
│   ├── extraction/
│   │   ├── extraction-schema.ts              # Default medical schema + dynamic custom-schema compiler
│   │   ├── pre-validator.service.ts          # Fast pre-check: PDF header, byte size, empty/corrupt buffers
│   │   ├── payload-normalizer.ts             # LLM output → persisted ExtractedField[] (incl. bbox re-map + zod validation)
│   │   └── referral-extraction.service.ts    # Pipeline orchestrator (claims job, drives the whole flow)
│   ├── server/
│   │   └── healthcheck.ts                    # Native node:http liveness endpoint (no framework)
│   ├── index.ts                              # Daemon bootstrap + graceful shutdown (SIGINT/SIGTERM)
├── package.json
├── tsconfig.json
└── Dockerfile                                # Production multi-stage Docker build
```

> Replaces the current `src/agent.ts` (`@google/adk`-based `LlmAgent`) entirely — a single extraction call does not earn a framework dependency. Drop `@google/adk`.

---

## 4. Component Responsibilities & Interface Specifications

### A. Configuration (`config/env.config.ts`)
Validates all required environment variables at process startup with `dotenv` + `zod`, throwing on any missing/invalid value (fail fast, not fail eventually):

- `AWS_REGION` (default: `us-east-1`)
- `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY`
- `SQS_QUEUE_URL`
- `S3_BUCKET_NAME` — **must match workbench-api's env name**
- `DATABASE_URL`
- `REDIS_URL` (default: `redis://localhost:6379` — matches compose's host mapping `${REDIS_PORT:-6379}:6379` and `.env.example`; inside the compose network the `agent_worker` service overrides it to `redis://redis:6379`)
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (default: `gemini-2.5-flash`)
- `MAX_CONCURRENT_MESSAGES` (default: `5`) — batch size per `ReceiveMessage` call
- `POLL_WAIT_SECONDS` (default: `20`) — `WaitTimeSeconds` long-poll duration
- `HEALTHCHECK_PORT` (default: `8002`)

### B. AWS clients (`clients/aws/`)
1. **`sqs-consumer.service.ts`**:
   - Manages `@aws-sdk/client-sqs` `SQSClient`.
   - Runs an asynchronous, non-blocking polling loop (`ReceiveMessageCommand`, `WaitTimeSeconds`, `MaxNumberOfMessages`).
   - Parses the S3 event envelope (§2.7), extracts `bucket`, `key`, and derives `clinicId` / `referralId` from the key pattern (§2.5).
   - Dispatches each received batch to the extraction pipeline via `Promise.allSettled` — one slow Gemini call must not serialize the whole `MaxNumberOfMessages` batch — and always deletes via the message's own receipt handle.
   - Deletes via `DeleteMessageCommand` **only** on terminal success (`COMPLETED`) or non-retryable rejection (`REJECTED`).
   - Leaves `FAILED` (system) messages to the visibility timeout for automated redelivery → eventual DLQ routing.
2. **`s3.service.ts`**:
   - Manages `@aws-sdk/client-s3` `S3Client`.
   - `GetObjectCommand` → collect readable stream into a `Buffer` for LLM consumption.

### C. Database & cache (`clients/database/`, `clients/cache/`)
1. **`prisma.service.ts`** — uses the monorepo root Prisma schema (one schema, one source of truth). All writes are idempotent:
   - `claimReferral(referralId)`: **conditional atomic update** — `updateMany({ where: { id, status: { in: [AWAITING_UPLOAD, PENDING] } }, data: { status: PROCESSING } })`. Returns `count`; if `0`, another consumer already claimed it → skip the job (SQS at-least-once idempotency guard).
   - `markAsCompleted(referralId, extractedPayload, patientName?)`: writes `extracted_payload`, sets `patient_name` from the extraction output's Patient Name field — match the default schema's `patient_name` key first, then a case-insensitive label match; custom schemas without such a field resolve to `null` (nullable by design) — and sets `COMPLETED`.
   - `markAsRejected(referralId, reason)`: sets `REJECTED` + `error_message`.
   - `markAsFailed(referralId, errorMessage)`: sets `FAILED` + `error_message`.
2. **`redis.service.ts`**:
   - `getReferralMetadata(referralId)`: `HGETALL referral:{id}` → `{ fileName, extractionSchema? }` (parse JSON; `''` → null). **If the hash is missing (eviction/restart/race), fall back to a Postgres read** of `fileName` / `extractionSchemaId` — never fail a job on a cache miss.
   - `indexReferralForClinic(clinicId, referralId)`: `SADD clinic:{clinic_id}:referrals {referral_id}`.

### D. Gemini client (`clients/ai/gemini-client.service.ts`)
- Manages `@google/genai` `GoogleGenAI` (no `@google/adk`).
- Deterministic generation: `model` (from env), `temperature: 0`, `responseMimeType: application/json`, `responseSchema`.
- Sends the PDF inline as base64 `application/pdf` alongside the structured instruction prompt.

### E. Extraction & validation (`extraction/`)
1. **`extraction-schema.ts`**:
   - Default medical schema with `isValidDocument` (boolean) + `rejectionReason` (string | null) guard fields, and per-field `fieldName`, `fieldValue`, `pageNumber` (0-indexed), `boundingBox` (`[ymin, xmin, ymax, xmax]` 0–1000, nullable).
   - Dynamic schema compiler mapping clinic `FieldDefinition[]` → Gemini `responseSchema`.
   - Document the schema-resolution chain: **referral-specific override → clinic `default_extraction_schema_id` → null (LLM default)**. Persist the resolved id on the referral row.
2. **`pre-validator.service.ts`** — cheap, no LLM: PDF magic header `%PDF-`, byte size ≤ 20MB, reject empty/corrupt buffers. Content-level "is this a referral?" is delegated to Gemini's `isValidDocument`.
3. **`payload-normalizer.ts`** — pure function:
   - Validates the raw LLM output with **zod** (reusing the `env.config.ts` schema dependency): `isValidDocument` boolean, `boundingBox` object with finite 0–1000 coordinates and `min ≤ max`, `pageNumber` int **≥ 1** (§2.2), strings non-empty.
   - The LLM emits the canonical `{xmin, ymin, xmax, ymax}` shape (§2.3) — no re-mapping; invalid/missing bboxes are sanitized to `null`.
   - Produces the persisted `ExtractedField[]` shape (§2.2) and derives `patientName`.
4. **`referral-extraction.service.ts`** — pipeline orchestrator:
   1. `claimReferral` — if unclaimed (count 0), return success-with-no-op so the SQS message can be deleted.
   2. `getReferralMetadata` (Redis → DB fallback).
   3. Download PDF bytes from S3.
   4. Run `pre-validator` → fail path: `markAsRejected`, return success (delete message).
   5. Resolve extraction schema (§E.1 chain).
   6. Call Gemini.
   7. Validate + normalize the output (`payload-normalizer`).
   8. `isValidDocument === false` → `markAsRejected(reason)`, return success (delete message).
   9. Valid → `markAsCompleted` (payload + patientName) **first**, then best-effort `indexReferralForClinic` (SADD failure logs and continues, never fails the job — §2.4).
   10. Return success → SQS delete.
   - Any **exception** in steps 2–9 → `markAsFailed`, return failure (leave message).

### F. Daemon bootstrap & healthcheck (`index.ts`, `server/healthcheck.ts`)
1. **`index.ts`**: build clients from validated env, start the consumer loop, optionally start the healthcheck server, register `SIGINT`/`SIGTERM` → stop polling, drain in-flight jobs, close connections, exit.
2. **`healthcheck.ts`**: minimal native `node:http` server on `HEALTHCHECK_PORT` answering `GET /healthz` → `200 OK`.

---

## 5. Dependencies

```jsonc
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.1117.0",
    "@aws-sdk/client-sqs": "^3.1117.0",
    "@google/genai": "^2.9.0",
    "@prisma/client": "^6.19.3",
    "ioredis": "^6.0.0",
    "dotenv": "^16.4.7",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "tsx": "^4.19.3",
    "typescript": "^5.7.3"
  }
}
```

- **Drop `@google/adk`** (current `src/agent.ts` dependency) — replaced by direct `@google/genai`.
- Scripts: `build` (`tsc`), `start` (`node dist/index.js`), `dev` (`tsx watch src/index.ts`), `typecheck` (`tsc --noEmit`), and `lint` (`tsc --noEmit` — the worker's only static gate, no eslint boilerplate).

---

## 6. AWS Provisioning & Docker Demo Configuration

Everything the demo needs outside the worker code itself. §6.1–§6.3 are one-time AWS-side setup; §6.4–§6.6 are small repo changes; §6.7 is the runbook.

### 6.1 SQS queue (main)
Create a **standard** queue (e.g. `plena-referral-extraction`) with:

| Attribute | Value | Why |
|---|---|---|
| `VisibilityTimeout` | **180s** | Must exceed worst-case job latency — Gemini call + normalization + DB write (§2.8). Trade-off: a system-failed message waits up to 180s for redelivery; acceptable. |
| `ReceiveMessageWaitTimeSeconds` | **20s** | Queue-level long polling (matches `POLL_WAIT_SECONDS`). |
| `MessageRetentionPeriod` | 4 days (default) | Bounds infinite redelivery until the DLQ exists (§6.2). |
| Redrive policy | **none yet** | DLQ is a secondary target — §6.2. |

### 6.2 Dead-letter queue — SECONDARY, after the main flow works end-to-end
Not required for the first demo; failed messages simply redeliver until retention expires. Once the happy path is proven:

1. Create a second standard queue `plena-referral-extraction-dlq` (same region, retention 14 days).
2. Set the main queue's **redrive policy**: `deadLetterTargetArn` = DLQ ARN, `maxReceiveCount` = 3.
3. Verify: a message that keeps failing (e.g. pointing at a deleted S3 object) lands in the DLQ after 3 receives instead of looping forever.

No worker code changes are needed for this — the "leave the message on `FAILED`" behavior (§4B) is already DLQ-compatible.

### 6.3 S3 event notification → SQS wiring
1. On `S3_BUCKET_NAME`, add an event notification: events `s3:ObjectCreated:Put` + `s3:ObjectCreated:Post`, **prefix filter `referrals/`, suffix filter `.pdf`** (without the filters, any unrelated object in the bucket enqueues a junk job), destination = the queue ARN from §6.1.
2. Queue access policy: allow `sqs:SendMessage` from `Service: s3.amazonaws.com` with `Condition.aws:SourceArn` = the bucket ARN (S3 rejects the notification config until this exists).
3. IAM for the worker's credentials: `s3:GetObject` on `arn:aws:s3:::<bucket>/referrals/*`; `sqs:ReceiveMessage`, `sqs:DeleteMessage`, `sqs:ChangeMessageVisibility`, `sqs:GetQueueAttributes` on the queue ARN. (workbench-api's presign permissions and bucket CORS are already covered in `.env.example`.)

### 6.4 `.env` values the demo needs
`.env.example` already carries every key the worker reads — fill in the blanks: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `SQS_QUEUE_URL` (from §6.1), `GEMINI_API_KEY`. Add one new key to `.env.example`: `WORKER_PORT=8002` (host mapping for the healthcheck, §6.5). Optional overrides: `GEMINI_MODEL`, `MAX_CONCURRENT_MESSAGES`, `POLL_WAIT_SECONDS`. Compose injects the in-network `DATABASE_URL`/`REDIS_URL` itself; everything else flows via `env_file: .env`.

### 6.5 `docker-compose.yml` — `agent_worker` service additions
The service already exists (dev image, `npm run dev:worker`); add the healthcheck wiring so reviewers and orchestrators can probe liveness:

```yaml
    environment:
      HEALTHCHECK_PORT: "8002"
    ports:
      - "${WORKER_PORT:-8002}:8002"
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:$${HEALTHCHECK_PORT:-8002}/healthz || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
```

(`wget` is BusyBox-built-in on the `node:20-alpine` dev image — no new packages.)

### 6.6 `docker/Dockerfile.dev` — Prisma client generation
`npm install` runs while only the package manifests are copied — `prisma/schema.prisma` isn't in the build context yet, so `@prisma/client`'s postinstall auto-generate has no schema to work from and the image's `node_modules` ends up without a generated client. Add one line after `COPY . .`:

```dockerfile
RUN npx prisma generate --schema=prisma/schema.prisma
```

The compose anonymous volume (`/app/node_modules`) preserves the image's generated client at runtime despite the source bind mount. On the host, `npm run prisma:generate` (or `make db-apply-migrations`) must re-run whenever the shared schema changes — mandatory for the `REJECTED` enum addition (§2.1).

### 6.7 Demo runbook
1. `cp .env.example .env` → fill the §6.4 values.
2. One-time AWS setup per §6.1–§6.3 (DLQ per §6.2 when ready).
3. Add `REJECTED` to the shared enum + workbench-api transitions (§2.1), then `make db-apply-migrations` (push schema, regenerate client).
4. `docker compose up --build -d` → `docker compose logs -f agent_worker` shows the poll loop; `curl localhost:8002/healthz` answers 200.
5. Upload PDFs via the web UI → watch rows move `AWAITING_UPLOAD → PROCESSING → COMPLETED` and the SSE refresh land in the UI.

---

## 7. Verification & Testing Workflow

1. **Type check:** `npm run typecheck` (zero TS errors) — the worker's only static quality gate; `tsc --noEmit` doubles as `lint`.
2. **End-to-end monorepo integration:** run the local Docker stack (`npm run docker:up`), upload a batch of PDFs via the Web UI, verify S3 upload → SQS message → worker consumption → Gemini extraction → Postgres update → SSE refresh in the UI.

---

## 8. Throughput & Scaling Note

The design doc targets 10–20k referrals/minute (~300/s). A single worker process cannot reach that: each Gemini call takes seconds, and the poll-loop's effective concurrency is far below 300/s even with `MAX_CONCURRENT_MESSAGES`. **The worker is designed to be horizontally scaled** — run N identical replicas competing on the same SQS queue (consumer-competition gives distribution and redelivery for free, no coordination logic in-process). The 10k/min target comes from "many workers," not "one fat worker." This is acceptable for the demo (single replica) and correct by construction at scale.

---

## 9. Cross-Service Touchpoints & References

These are the places outside `apps/agent_worker` that this plan depends on or refers to. Listed for reference so the relevant code/schema is easy to find; no action is implied by this plan alone.

| Touchpoint | Reference |
|---|---|
| `REJECTED` status value — referenced by §2.1/§4C but not yet in the enum | `prisma/schema.prisma:13` (`enum ReferralStatus`) |
| Status semantics / allowed transitions — referenced by §2.1 | `apps/workbench-api/src/domain/referral/referral-status.value-object.ts` |
| `extracted_payload` consumer shape (`ExtractedField[]`) — matches §2.2 | workbench-api mapper / review UI |
| Worker env-name parity (`S3_BUCKET_NAME`, `REDIS_URL`, etc.) — see §2.6/§4A | `apps/agent_worker/README.md` |
