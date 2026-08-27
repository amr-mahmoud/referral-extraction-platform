# WorkBench API

> Lives at `apps/workbench-api/` in the monorepo, alongside `apps/web` (Next.js review UI)
> and `apps/agent_worker` (SQS → Gemini extraction).

## What this is

The WorkBench API is the NestJS service that owns everything client-facing: clinic auth,
extraction schema management, referral creation, review reads, and pushing live status
updates over SSE. It never touches the AI extraction itself and never handles a PDF's bytes
directly — those are deliberately someone else's job.

## Tech stack

| Dependency | Purpose |
|---|---|
| `@nestjs/*` | API framework — required stack |
| `prisma` | Postgres ORM — schema shared with Agent Worker (`prisma/schema.prisma`) |
| `@scalar/nestjs-api-reference` + `@nestjs/swagger` | Interactive API playground, rendered from the OpenAPI doc |
| `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` | Issues presigned upload/download URLs |
| `ioredis` | Redis cache-aside layer (worker metadata, dashboard projections, clinic index) |
| `bcrypt` | Password hashing |
| `jsonwebtoken` | Stateless JWT auth |
| `pg` | Raw Postgres client for `LISTEN`/`NOTIFY` (Prisma can't express it) |
| `class-validator` / `class-transformer` | DTO validation (global `ValidationPipe`) |

## Responsibilities

- Clinic signup / login, JWT issuance, httpOnly cookie
- Scoping every query to the authenticated clinic (multi-tenancy, enforced by `JwtAuthGuard`)
- Creating extraction schemas — via web form (field name + description) or JSON upload
- Creating a referral row, resolving its extraction schema, and issuing a presigned S3 PUT URL
- Serving referral lists and detail views (extracted payload + a presigned GET URL for the PDF)
- Streaming status changes to the client over SSE (Postgres `LISTEN`/`NOTIFY` → SSE)
- Maintaining the Redis cache-aside layer, with a compensating saga guaranteeing all-or-nothing referral creation

## What it explicitly does *not* do

- **Doesn't receive the PDF bytes.** The client uploads straight to S3 with the presigned
  URL this service issues. Proxying 20MB files through the API at the assignment's target
  throughput would make this the bottleneck instead of just the orchestration layer.
- **Doesn't call Gemini.** Extraction is `agent_worker`'s job — this service only ever reads
  the results the worker writes.
- **Doesn't consume SQS.** The queue exists between S3 and the worker; this service has no
  reason to know it's there.

## Domain aggregates

The domain is three aggregates, each a consistency boundary whose invariants are enforced by
guard clauses that throw typed `DomainException`s at the boundary (see Error handling):

| Aggregate | File | Role | Key invariants | Relations |
|---|---|---|---|---|
| `Clinic` | `domain/clinic/clinic.aggregate.ts` | The tenant account — owns credentials, its default schema, and the schema family it can resolve | clinicName non-empty; username matches `^[a-zA-Z0-9_]{3,50}$`; password ≥ 8 chars; always has a password hash; own id non-empty | `extractionSchemas[]` (hydrated relations), `defaultExtractionSchemaId` |
| `ExtractionSchema` | `domain/extraction-schema/extraction-schema.aggregate.ts` | A versioned set of field definitions telling Gemini what to extract | non-empty `schemaDefinition`; no duplicate slugified keys; positive-integer version (`oldVersion + 1`); UUID id; immutable once built; title falls back to `Custom schema v{n}` | belongs to a `Clinic`; referenced by `Referral.extractionSchemaId` |
| `Referral` | `domain/referral/referral.aggregate.ts` | A single PDF upload tracked from `AWAITING_UPLOAD` to a terminal state | `fileName` ends in `.pdf`; patientName optional but non-empty; state machine `AWAITING_UPLOAD → PENDING → PROCESSING → COMPLETED/FAILED/REJECTED`; schema fixed once resolved; correction only when `COMPLETED` | `clinicId`, `extractionSchemaId`, `extractedPayload` (`ExtractedField[]`) |

Every method that can fail rejects fast with a domain exception — no aggregate method lets an
invalid state or an unexpected error escape unhandled. The one external call,
`Clinic.verifyPassword`, is wrapped so the aggregate only ever surfaces `DomainException`s.

## API surface

| Method & path | Purpose |
|---|---|
| `POST /auth/signup` | Register a clinic (name, username, password) |
| `POST /auth/login` | Authenticate → JWT set as an httpOnly cookie |
| `GET /clinics/me` | Current authenticated clinic profile |
| `POST /extraction-schemas` | Create/update a schema version — field list or uploaded JSON map |
| `GET /extraction-schemas` | List the authenticated clinic's schema versions |
| `POST /referrals` | Create a referral batch, resolve schemas, return `{ referral, presigned_upload }[]` |
| `GET /referrals` | List the clinic's referrals, cache-aside from Redis (newest first) |
| `GET /referrals/:id` | Detail: status, `extractedPayload`, presigned GET URL for the PDF |
| `GET /referrals/stream` | SSE — live `referral-changed` events for the clinic |

Interactive docs are served at `/reference` (Scalar) and the raw OpenAPI JSON at `/docs-json`
(consumed by the web app's `openapi-typescript` codegen).

## Auth & multi-tenancy

JWT in an httpOnly cookie rather than a server-side session store. A single `JwtAuthGuard`
extracts `clinic_id` from the token and attaches it to the request; every repository call is
scoped with that id, so "a clinic only sees its own referrals" is enforced in one place rather
than repeated per-controller. The SSE stream filters each `LISTEN`/`NOTIFY` ping by `clinicId`
before fetching, so a broadcast never leaks across tenants.

## Presigned upload flow

`POST /referrals` resolves the extraction schema for the batch (see cache-aside below), builds
a `Referral` aggregate per file (`status = AWAITING_UPLOAD`), presigns an S3 `PUT` URL scoped
to `referrals/{clinic_id}/{referral_id}.pdf`, then **persists rows and writes cache
concurrently** with a compensating saga (see below). Presigning happens before the DB write so
a presigning failure leaves zero rows committed.

## Real-time status (SSE)

A Postgres trigger fires `NOTIFY` on `referrals` inserts and on `status`/`extracted_payload`/
`patient_name`/`error_message` updates. `PostgresListenService` parks a raw `pg` connection on
`LISTEN referral_changed` (reconnecting on drop) and republishes each ping as an RxJS event.
`ClinicsController` filters by the authenticated clinic and, per ping, re-reads the referral
from Postgres to refresh the Redis view cache, then pushes the full record down the open SSE
connection. Chosen over WebSockets because the traffic is one-directional and infrequent.

## Caching Architecture (Redis Cache-Aside)

Postgres remains the strict system of record; Redis is an accelerated cache-aside layer. Every
read path falls back to Postgres on a miss and backfills, so a cold/evicted cache degrades
latency, never correctness.

### Key Map & Cache Entities

| Key Pattern | Redis Type | Cached Entity | Purpose | Consistency & Failure Policy |
|---|---|---|---|---|
| `clinic:{clinic_id}` | `String` (JSON) | `CachedClinic` | Hydrates the `Clinic` aggregate with its **full `extractionSchemas[]` payloads** — resolves schemas with **zero DB reads** on a hit. | **Best-effort, self-healing:** a miss queries Postgres and backfills; the next miss re-syncs. |
| `referral:{referral_id}` | `Hash` | `CachedReferral` | **1. Worker context:** `fileName` + `extractionSchema` — the worker reads schema rules in O(1) without touching Postgres.<br>**2. UI read-model:** `referral` — pre-computed dashboard projection. | **Combined atomic write** (one pipelined `HSET` at creation), protected by the compensating saga. The volatile `referral` field is rewritten on status changes without touching the worker context. |
| `clinic:{clinic_id}:referrals` | `Set` | referral IDs | **1→N secondary index:** O(1) membership + a single pipelined multi-key fetch of referral projections for the dashboard. | **Best-effort, self-healing:** 10-minute TTL bounds drift; a miss rebuilds from Postgres. |

### Architectural Highlights

1. **Zero-DB schema resolution:** during `POST /referrals`, `getExtractionSchema` reads
   `clinic:{clinic_id}`, rehydrates a `Clinic` aggregate (with its full schemas), and calls
   `clinic.findExtractionSchema(...)` — the resolved schema comes straight from cache. The
   clinic cache carries **full schema payloads** (same `CachedExtractionSchema` shape the
   worker metadata uses), so a hit is genuinely zero-read.
2. **Single-roundtrip ingest pipeline:** worker metadata and the initial dashboard projection
   are bundled into one pipelined `HSET` per referral.
3. **Compensating saga (all-or-nothing creation):** Postgres persistence and the Redis write
   run concurrently via `Promise.allSettled`. If either side fails after the other committed,
   compensating rollbacks (`deleteReferralsByIds` / `deleteReferralsToCache`) restore the
   pre-request state — no orphan rows, no phantom cache entries.
4. **Fast-fail Redis client:** `maxRetriesPerRequest: 2`, `connectTimeout: 3000ms` prevent
   request-latency degradation during transient Redis outages.
5. **`CachedClinic` derived from the domain** via `Omit<ClinicInputProps, …>` — shared fields
   stay single-sourced and constructor-only inputs are dropped.

## Error handling

- Three-layer typed exceptions — `DomainException`, `ApplicationException`,
  `RepositoryException` — all extend `HttpException`, so they are self-describing responses.
- A single global `@Catch()` `AllExceptionFilter` renders every exception (including Nest
  built-ins like validation/auth errors) into one consistent envelope with a `timestamp`; any
  unknown error is logged with its stack and answered 500 without leaking internals.
- Error codes and their HTTP-status mappings live in the shared `libs/errors/` enums.

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (same schema as `agent_worker`) |
| `REDIS_URL` | Redis connection string for the cache-aside layer |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Signing secret / token lifetime |
| `AWS_REGION` | Region for the S3 client (presign only — no SQS access needed here) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Scoped IAM credentials (S3 put/get presign only) |
| `S3_BUCKET_NAME` | Bucket referenced when generating presigned URLs |
| `S3_PRESIGN_EXPIRES_IN` | Presigned URL lifetime in seconds (default 900) |
| `PORT` | HTTP listen port (default 8001) |

## Project structure

```
apps/workbench-api/
├── libs/errors/                     # shared error-code enums + HTTP-status maps
└── src/
    ├── domain/                      # innermost layer — aggregates & value objects
    │   ├── clinic/                  #   Clinic aggregate, PasswordHash VO, errors, types
    │   ├── referral/                #   Referral aggregate, status/field/bbox VOs, types
    │   ├── extraction-schema/       #   ExtractionSchema aggregate, FieldDefinition VO, types
    │   ├── shared/                  #   DomainException base
    │   └── domain-types/            #   FieldDefinitionInput
    ├── application/                 # use-cases, ports, read-models, command types
    │   ├── application.service.ts   #   unified use-case orchestrator
    │   ├── types.ts                 #   command/result interfaces
    │   ├── ports/                   #   repository/storage/caching/token/encryption ports
    │   ├── read-models/             #   ReferralView projection
    │   └── errors/                  #   ApplicationException, NotImplementedError
    ├── infrastructure/              # adapters
    │   ├── repository/              #   Prisma repositories + mappers (one per aggregate)
    │   ├── caching/                 #   RedisService (CachingServicePort)
    │   ├── storage/                 #   S3StorageService (StoragePort)
    │   ├── auth/                    #   bcrypt + JWT adapters
    │   ├── notifications/           #   PostgresListenService (LISTEN/NOTIFY)
    │   ├── filters/                 #   AllExceptionFilter (global @Catch())
    │   └── errors/                  #   RepositoryException
    └── interface/http/              # controllers, DTOs, guards, types
        ├── auth/                    #   AuthController
        ├── clinics/                 #   ClinicsController (schemas + referrals + SSE)
        ├── dto/                     #   class-validator DTOs + mappers
        ├── guards/                  #   JwtAuthGuard
        └── types.ts                 #   AuthenticatedRequest
```

Each layer depends only inward (`interface → application → domain`); infrastructure adapters
implement application ports. Interfaces/types live in co-located `types.ts` files, separate
from classes. `prisma/schema.prisma` at the repo root is the single shared schema used by both
this service and `agent_worker`. See `docs/domain-layer.md` for the domain layer in detail.

## Running locally

```bash
make db-setup       # Postgres + Prisma push + generate + LISTEN/NOTIFY trigger
make redis-build    # Redis container
make dev-api        # nest start --watch on :8001
```

Or run the whole stack with `npm run docker:up` (see the root README). The API boots without
the SQS queue or `agent_worker` running — referrals will simply sit in `AWAITING_UPLOAD` until
the extraction pipeline is up.

## Assumptions & limitations

- **SSE fan-out via in-process `LISTEN` works for a single API instance.** Multiple replicas
  behind a load balancer would need Redis pub/sub in front of it so a status change reaches
  whichever instance holds the client's connection — the scaling seam, not needed for the demo.
- **No row-level security at the Postgres level** — multi-tenancy is enforced entirely in the
  application layer (the guard). A production build handling real PHI would likely add RLS.
- **No request throttling** — rate limiting would be added ahead of the presign endpoint before
  real traffic.
- **Cache writes are best-effort where Postgres can answer** (views, clinic cache), **fail-closed
  where the worker depends on the cache** (referral metadata at creation — but even there the
  worker has a Postgres fallback), and **compensated** where a partial commit would leave orphan
  rows or phantom cache entries.
