# Plena Referral Extraction Platform

A high-throughput medical referral extraction workbench. Ingests medical referral PDFs, extracts structured clinical data using **Gemini** with **spatial bounding-box grounding**, and streams live updates into a **Next.js** review interface.

---

## ⚡ Quick Start: How to Run in Dev (Step-by-Step)

Get the full platform running locally using only **`make`** commands.

### 1. Install Dependencies
```bash
make install
```
*Installs all npm dependencies across monorepo workspaces.*

---

### 2. Configure Environment
```bash
# Option A: Decrypt pre-configured environment (Reviewers)
make env-decrypt   # Prompts for the passphrase provided in submission notes

# Option B: Or copy example and fill in keys manually
cp .env.example .env
```

---

### 3. Setup Postgres & Run Migrations (1 Command)
```bash
make db-setup
```
*Spins up the Postgres container, waits until healthy, pushes the Prisma schema, generates the Prisma client, and applies the `LISTEN/NOTIFY` trigger.*

---

### 4. Start Redis Cache (1 Command)
```bash
make redis-build
```
*Spins up the Redis container in the background for cache-aside dashboard lookups.*

---

### 5. Launch All 3 Applications (1 Command)
```bash
make dev
```
*Starts **Next.js Web**, **NestJS Workbench API**, and **Agent Worker** concurrently with unified logs.*

> **Individual app runners (optional):**
> - `make dev-web` — Next.js UI (`http://localhost:3000`)
> - `make dev-api` — NestJS API (`http://localhost:8001`)
> - `make dev-worker` — SQS Worker Daemon (`http://localhost:8002/healthz`)

---

### 6. Verify & Review
| Service | URL | Description |
|---|---|---|
| **Web Interface** | [`http://localhost:3000`](http://localhost:3000) | Clinic sign-up, PDF uploads, live review workbench |
| **Workbench API** | [`http://localhost:8001/reference`](http://localhost:8001/reference) | Interactive Scalar API documentation |
| **Worker Health** | [`http://localhost:8002/healthz`](http://localhost:8002/healthz) | Worker daemon liveness probe |

---

### 7. Stop Local Services
```bash
make kill         # Stops all local dev processes
docker compose down  # Stops Postgres & Redis containers
```

---

## 🏗️ Architecture & Apps

```text
Browser / Next.js UI ─(Direct S3 PUT)─▶ AWS S3 ─(ObjectCreated)─▶ SQS (upload events)
                                                                      │
                                                              Agent Worker
                                                          (Redis claim, Gemini)
                                                                      │
                               publishes PROCESSING / COMPLETED / REJECTED / FAILED
                                                                      │
                                                        SQS (status updates)
                                                                      │
                                            Workbench API ─(applies DB transition)─▶ Postgres
                                                 │                                │
                                                 │◀────────(LISTEN/NOTIFY)─────────┘
                                                 │
                                           Redis (cache-aside index) ◀─(SSE)─▶ Real-Time Dashboard
```

The Agent Worker is **fully decoupled from the database**: it claims referrals via a TTL'd Redis lock and publishes status events to the status-update SQS queue. The Workbench API is the **only** writer to Postgres — it consumes those events, applies idempotent status transitions, and refreshes the cache. The worker never holds Postgres credentials.

| Application | Directory | Stack | Port | Purpose |
|---|---|---|---|---|
| **Web** | `apps/web` | Next.js 16 (App Router), Tailwind CSS, React-PDF | `3000` | Review interface, direct-to-S3 uploads, spatial bounding boxes |
| **Workbench API** | `apps/workbench-api` | NestJS, Prisma, Redis, PostgreSQL, AWS SQS | `8001` | Multi-tenant auth, schemas, presigned URLs, SSE stream, status-update queue consumer |
| **Agent Worker** | `apps/agent_worker` | Node.js, TypeScript, Gemini, AWS SQS | `8002` | Async queue processor, AI extraction, spatial grounding |

---

## 🔄 End-to-End Workflow

1. **Authentication & Tenant Isolation**: Clinic logs in with JWT; claims strictly isolate referrals, schemas, and streams per clinic.
2. **Request Upload Slot**: API resolves schema, records referral as `PENDING` in PostgreSQL, and issues a presigned S3 PUT URL.
3. **Redis Cache-Aside Metadata**: API caches schema & filename in Redis so the worker recovers context in $O(1)$ without database round-trips.
4. **Direct S3 Upload**: Browser streams PDF bytes directly to AWS S3, bypassing the API to eliminate server bandwidth bottlenecks.
5. **Queue Trigger**: S3 `ObjectCreated` event pushes a notification with the object key into the AWS SQS upload queue.
6. **Claim & Signal Processing**: Worker claims the referral via a TTL'd Redis lock, then publishes a `PROCESSING` status event; the Workbench API applies it to Postgres.
7. **Gemini Extraction**: Worker sends the PDF and resolved schema to Gemini, extracting clinical fields and normalized bounding boxes.
8. **Status Write-back (queue-driven)**: The worker publishes a terminal result (`COMPLETED` / `REJECTED` / `FAILED` with the payload or reason) to the status-update queue. The Workbench API — the only writer to Postgres — applies the idempotent transition, persists the payload/reason, and refreshes the Redis view cache.
9. **Real-Time Notification (Notify + Fetch)**: Postgres emits a `LISTEN/NOTIFY` ping; API fetches fresh payload and pushes it over SSE to the browser.
10. **High-Speed Clinic Lookups**: Dashboard loads referrals instantly from the per-clinic Redis set in $O(1)$ time, bypassing table scans.
11. **Review UI & Spatial Highlighting**: Next.js displays PDF and fields side-by-side; clicking a field highlights its bounding box on the PDF.

---

## ✨ Core Features

- **Multi-Tenant Isolation**: Complete per-clinic data separation enforced via JWT auth across API routes and SSE streams.
- **Direct-to-S3 Uploads**: High-throughput file uploads via short-lived presigned URLs with zero server bandwidth bottlenecks.
- **Custom Extraction Schemas**: Create named schema versions in-app, upload JSON schema definitions, or fallback to default clinical schemas.
- **Spatial Grounding**: Every extracted field is mapped with normalized coordinates `[ymin, xmin, ymax, xmax]` for click-to-highlight PDF verification.
- **Real-Time SSE Streaming**: Live referral lifecycle updates (`PENDING → PROCESSING → COMPLETED`) pushed via Postgres `LISTEN/NOTIFY` and Redis.

---

## 🛠️ Command Reference (`Makefile`)

| Command | Action |
|---|---|
| `make help` | Display all available commands |
| `make install` | Install all monorepo workspace dependencies |
| `make dev` | Run Web, API, and Worker simultaneously |
| `make dev-web` | Run only Next.js Web (`apps/web`) |
| `make dev-api` | Run only NestJS Workbench API (`apps/workbench-api`) |
| `make dev-worker` | Run only Agent Worker (`apps/agent_worker`) |
| `make db-setup` | Start Postgres container + push schema + generate client + apply triggers |
| `make db-reset` | Wipe Postgres container volume and re-initialize from scratch |
| `make db-apply-migrations` | Apply Prisma migrations & triggers while preserving data |
| `make redis-build` | Start Redis container in detached mode |
| `make redis-restart` | Restart Redis container |
| `make redis-cli` | Open interactive `redis-cli` in Redis container |
| `make env-encrypt` | Encrypt `.env` into `.env.enc` via OpenSSL AES-256 |
| `make env-decrypt` | Decrypt `.env.enc` into `.env` via OpenSSL AES-256 |
| `make kill` / `make stop` | Kill all running local development processes |
| `make codegen-api` | Regenerate TypeScript API types from OpenAPI spec |
| `make docker-up` | Build & run full stack in Docker containers |
| `make docker-down` | Stop Docker Compose stack |

---

## ⚙️ Configuration (`.env`)

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://referral:referral@localhost:5434/referral_extraction?connection_limit=15` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret | `plena-dev-secret-change-me` |
| `AWS_ACCESS_KEY_ID` | AWS IAM Access Key for S3/SQS | — |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Key for S3/SQS | — |
| `S3_BUCKET_NAME` | Target S3 bucket for referral PDFs | `referral-workbench` |
| `SQS_QUEUE_URL` | AWS SQS Queue URL for upload events | — |
| `SQS_STATUS_UPDATE_URL` | AWS SQS Queue the worker publishes status results to (consumed by the Workbench API) | — |
| `REFERRAL_CLAIM_TTL_SECONDS` | Worker's Redis claim-lock TTL — must exceed worst-case extraction time | `600` |
| `GEMINI_API_KEY` | Google Gemini API Key | — |
| `GEMINI_MODEL` | Gemini extraction model | `gemini-2.0-flash` |

---

## 📂 Repository Layout

```text
referral-extraction-platform/
├── apps/
│   ├── web/               # Next.js 16 Web Review Interface (Frontend)
│   ├── workbench-api/     # NestJS REST & SSE Server (Backend)
│   └── agent_worker/      # Node.js SQS Worker Daemon (AI Extraction)
├── prisma/
│   └── schema.prisma      # Single shared database schema
├── docker/
│   ├── Dockerfile.dev     # Shared development Dockerfile
│   └── postgres/init/     # Postgres triggers & extensions
├── docker-compose.yml     # Complete container topology (Postgres, Redis, Web, API, Worker)
├── Makefile               # Primary developer CLI
└── package.json           # Monorepo workspaces configuration
```
