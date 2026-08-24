# AI Context Log & Commit History

This document serves as the centralized commit history and decision log for the project.

---

## v0.0.1 | 2026-08-24 | feat

**Category:** System Foundation  
**Summary:** Initialize monorepo workspace structure with Next.js web application and agent worker service.  
**SuggestedCommitMessage:** feat: initialize monorepo with Next.js web app and agent worker | System Foundation

### 🧠 Logic & Decisions

- **The Why:** Established monorepo topology using npm workspaces to decouple the Next.js review interface (`apps/web`) from the asynchronous agent worker processing pipeline (`apps/agent_worker`), enforcing clear architectural boundaries from the start.
- **State Change:** Initialized root npm workspace configurations, Next.js App Router setup in `apps/web`, agent worker setup in `apps/agent_worker`, and global workspace scripts.

### 🔗 Dependencies

- **Modified:** `package.json`, `package-lock.json`, `.gitignore`, `CLAUDE.md`, `apps/web/*`, `apps/agent_worker/*`
- **Impact:** Establishes core monorepo foundation for upcoming domain models, workbench API endpoints, and SQS/Gemini extraction worker integration.

---

## v0.0.2 | 2026-08-24 | refactor

**Category:** System Foundation  
**Summary:** Convert agent worker application from NestJS to a lightweight, standalone Node.js and TypeScript worker service.  
**SuggestedCommitMessage:** refactor: convert agent worker to standalone Node.js TS service | System Foundation

### 🧠 Logic & Decisions

- **The Why:** Simplified the asynchronous worker architecture in `apps/agent_worker` by replacing NestJS boilerplate with a lean, standalone Node.js + TypeScript service (`tsx watch` in dev, `tsc` for build) aligned with the solution design specifications for the worker agent tier.
- **State Change:** Replaced NestJS controllers, modules, and `nest-cli.json` in `apps/agent_worker` with a clean `src/index.ts` entrypoint, lightweight TypeScript configuration, and updated root npm workspace scripts (`dev:worker`).

### 🔗 Dependencies

- **Modified:** `package.json`, `apps/agent_worker/package.json`, `apps/agent_worker/tsconfig.json`, `apps/agent_worker/src/index.ts`, `apps/agent_worker/README.md`
- **Impact:** Lightweight background consumer for processing SQS jobs and calling Gemini LLM without framework overhead.

---

## v0.0.3 | 2026-08-24 | docs

**Category:** System Architecture  
**Summary:** Expand Agent Worker README with detailed architecture rationale, SQS-Gemini processing pipeline, state machine, and environment specs.  
**SuggestedCommitMessage:** docs: update agent worker README with architecture decisions and processing flow | System Architecture

### 🧠 Logic & Decisions

- **The Why:** Formally documented the structural rationale for using a standalone Node.js process over NestJS for `apps/agent_worker`, detailing its SQS long-polling lifecycle, graceful degradation strategy for Gemini spatial grounding, and Postgres status transitions.
- **State Change:** Added comprehensive README documentation outlining environment variables, lifecycle state transitions, local execution guide, and architectural assumptions.

### 🔗 Dependencies

- **Modified:** `apps/agent_worker/README.md`
- **Impact:** Provides clear system design guidance and operational context for developers and maintainers of the worker service.

---

## v0.0.4 | 2026-08-24 | build

**Category:** System Foundation  
**Summary:** Add Makefile automation, concurrent local development scripts, and resolve workspace build dependencies across all 3 monorepo apps.  
**SuggestedCommitMessage:** build: add Makefile and concurrent dev runners for monorepo apps | System Foundation

### 🧠 Logic & Decisions

- **The Why:** Created a structured root `Makefile` and `concurrently` workspace configuration to provide simple single-command local execution (`make dev` / `npm run dev`) and individual target runners for `apps/web`, `apps/workbench-api`, and `apps/agent_worker`.
- **State Change:** Fixed directory permissions, verified zero-error TypeScript/Next.js/NestJS builds across all 3 monorepo apps, and established unified developer scripts.

### 🔗 Dependencies

- **Modified:** `Makefile`, `package.json`, `package-lock.json`
- **Impact:** Enables streamlined local development and build verification across all monorepo services.

---

## v0.0.5 | 2026-08-24 | build

**Category:** System Foundation  
**Summary:** Add Makefile targets (make kill / make stop) to terminate all active local development processes for monorepo applications.  
**SuggestedCommitMessage:** build: add make kill targets for stopping running app processes | System Foundation

### 🧠 Logic & Decisions

- **The Why:** Added explicit process management targets (`make kill`, `make stop`, `make kill-all`) to the Makefile using `pkill -f` to cleanly stop any active background or foreground instances of Next.js, NestJS, `tsx watch`, and `concurrently`.
- **State Change:** Expanded Makefile with process termination targets for local developer environment cleanup.

### 🔗 Dependencies

- **Modified:** `Makefile`, `docs/commit-log.md`
- **Impact:** Allows developers to stop all running local app instances with a single command (`make stop` / `make kill`).

---

## v0.0.6 | 2026-08-24 | docs

**Category:** System Architecture  
**Summary:** Document Monorepo Applications & Local Ports summary table and setup guide in root README.md.  
**SuggestedCommitMessage:** docs: add monorepo apps and local ports summary to root README.md | System Architecture

### 🧠 Logic & Decisions

- **The Why:** Updated the root `README.md` to provide a clear executive overview, monorepo topology map, local ports summary table (`apps/web` on 3000, `apps/workbench-api` on 8001, `apps/agent_worker` as SQS background daemon), and `make` commands.
- **State Change:** Replaced placeholder `README.md` with complete documentation suite.

### 🔗 Dependencies

- **Modified:** `README.md`, `docs/commit-log.md`
- **Impact:** Serves as the primary onboarding and architecture reference for developers inspecting the root repository.

---

## v0.0.7 | 2026-08-24 | build

**Category:** Infrastructure Services  
**Summary:** Add Makefile targets for Docker Compose stack management (docker-up, docker-dev, docker-down, docker-logs, docker-clean).  
**SuggestedCommitMessage:** build: add Docker Compose management targets to Makefile | Infrastructure Services

### 🧠 Logic & Decisions

- **The Why:** Added explicit Makefile targets (`make docker-up`, `make docker-dev`, `make docker-down`, `make docker-logs`, `make docker-clean`) to streamline container orchestration across the 5 local stack services (Postgres, Redis, Web, API, Worker).
- **State Change:** Expanded Makefile with container lifecycle and volume purging targets.

### 🔗 Dependencies

- **Modified:** `Makefile`, `docs/commit-log.md`
- **Impact:** Provides single-command Docker stack control for local development and clean-slate resets.

---

## v0.0.8 | 2026-08-24 | build

**Category:** Infrastructure Services  
**Summary:** Add Makefile permission repair target (make docker-give-perms / make fix-perms) for restoring ~/.docker and workspace ownership.  
**SuggestedCommitMessage:** build: add make fix-perms target for Docker buildx ownership repair | Infrastructure Services

### 🧠 Logic & Decisions

- **The Why:** Added `make docker-give-perms` / `make fix-perms` target (`sudo chown -R $(whoami) ~/.docker .`) to resolve Docker Desktop buildx permission errors (`~/.docker/buildx/activity/desktop-linux: permission denied`).
- **State Change:** Added Makefile permission restoration target for Docker buildx user environment repairs.

### 🔗 Dependencies

- **Modified:** `Makefile`, `docs/commit-log.md`
- **Impact:** Resolves Docker buildx permission errors with a single `make fix-perms` command.

---

## v0.0.9 | 2026-08-24 | build

**Category:** Infrastructure Services  
**Summary:** Add make targets (docker-dev-backend / docker-dev-api) to build and run the NestJS Workbench API container in Docker dev mode.  
**SuggestedCommitMessage:** build: add docker-dev-backend target to Makefile | Infrastructure Services

### 🧠 Logic & Decisions

- **The Why:** Added `make docker-dev-backend` (and `make docker-dev-api` alias) to allow developers to build and start specifically the NestJS Workbench API container and its backend database dependencies (`postgres`, `redis`) in dev mode with live logs.
- **State Change:** Added targeted backend container dev runner in Makefile.

### 🔗 Dependencies

- **Modified:** `Makefile`, `docs/commit-log.md`
- **Impact:** Allows targeted development of the backend container service without building the frontend container.

---

## v0.0.10 | 2026-08-24 | feat

**Category:** System Architecture  
**Summary:** Implement Clean DDD architecture layers, domain aggregates, and dependency injection wiring in Workbench API.  
**SuggestedCommitMessage:** feat: implement Clean DDD architecture layers and domain aggregates in workbench-api | System Architecture

### 🧠 Logic & Decisions

- **The Why:** Structured `apps/workbench-api` into Hexagonal / Clean Architecture boundaries (`domain/`, `application/`, `infrastructure/`, `interface/`). Encapsulated `Clinic`, `Referral`, and `ExtractionSchema` aggregate roots with zero framework dependencies.
- **State Change:** Wired NestJS dependency injection modules (`ApplicationModule`, `InfrastructureModule`, `InterfaceModule`), mapped HTTP controllers, resolved port dependency tokens (`TOKEN_PORT`, `CLINIC_REPOSITORY_PORT`, `REFERRAL_REPOSITORY_PORT`), and established strict aggregate boundaries.

### 🔗 Dependencies

- **Modified:** `apps/workbench-api/*`, `Makefile`, `apps/web/README.md`, `.agent/rules/frontend-next-file-structure.md`, `docs/commit-log.md`
- **Impact:** Establishes pure Domain-Driven Design foundation for auth, referral review, and schema management services in Workbench API.

---

## v0.0.11 | 2026-08-24 | feat

**Category:** Interface Services  
**Summary:** Integrate Scalar API Reference playground and Swagger OpenAPI documentation in Workbench API.  
**SuggestedCommitMessage:** feat: integrate Scalar API Reference playground and OpenAPI decorators in workbench-api | Interface Services

### 🧠 Logic & Decisions

- **The Why:** Configured `@scalar/nestjs-api-reference` and `@nestjs/swagger` in `apps/workbench-api` (`main.ts` mounted at `/reference`). Decorated interface controllers (`AuthController`, `ClinicsController`) and DTO classes (`LoginRequest`, `SignupRequest`, `CreateExtractionSchemaRequest`, `CreateReferralRequest`, `ListReferralsQueryDto`, `UpdateReferralRequest`) with OpenAPI metadata to provide an interactive API playground and enable automated TypeScript client code generation.
- **State Change:** Added `/reference` Scalar UI playground route, Swagger DocumentBuilder, and decorated DTO request/response contracts.

### 🔗 Dependencies

- **Modified:** `apps/workbench-api/src/main.ts`, `apps/workbench-api/src/interface/http/**/*`, `apps/workbench-api/package.json`
- **Impact:** Provides an interactive API playground at `http://localhost:8001/reference` and standardized OpenAPI spec output for client codegen.

---

## v0.0.12 | 2026-08-24 | feat

**Category:** Infrastructure Services  
**Summary:** Configure Prisma ORM schema, client generation, and workspace scripts for Workbench API.  
**SuggestedCommitMessage:** feat: configure Prisma ORM schema and client integration in workbench-api | Infrastructure Services

### 🧠 Logic & Decisions

- **The Why:** Configured shared `prisma/schema.prisma`, added root npm workspace scripts (`prisma:generate`, `prisma:migrate`, `prisma:push`, `prisma:studio`), and updated `PrismaService` in `apps/workbench-api/src/infrastructure/repository/prisma.service.ts` to extend generated `PrismaClient` with NestJS module lifecycle hooks (`$connect` / `$disconnect`).
- **State Change:** Enabled Prisma ORM client generation and database connectivity for persistence adapters in `workbench-api`.

### 🔗 Dependencies

- **Modified:** `package.json`, `package-lock.json`, `prisma/schema.prisma`, `apps/workbench-api/src/infrastructure/repository/prisma.service.ts`, `apps/workbench-api/README.md`, `docs/commit-log.md`
- **Impact:** Establishes standard Prisma database connectivity for `Clinic`, `Referral`, and `ExtractionSchema` aggregate persistence.

---

## v0.0.13 | 2026-08-24 | refactor

**Category:** Infrastructure Services  
**Summary:** Refactor encryption ports, scope aggregate queries, configure Postgres port 5435, and add make db-reset target.  
**SuggestedCommitMessage:** refactor: simplify repository ports, set Postgres port 5435, and add make db-reset target | Infrastructure Services

### 🧠 Logic & Decisions

- **The Why:** Simplified aggregate persistence boundaries by removing separate `ExtractionSchemaRepositoryPort` (extraction schemas are queried within `Clinic` and `Referral` aggregate contexts). Renamed `PASSWORD_HASHER_PORT` to `ENCRYPTION_PORT` (`EncryptionPort` interface). Configured local Postgres container host port mapping to `5435` in `docker-compose.yml` and `.env.example`, and added `make db-reset` to purge container volumes, wait for Postgres health check on port 5435, and push Prisma schema automatically.
- **State Change:** Re-mapped Postgres port to 5435, added `make db-reset` script, and streamlined application ports and infrastructure module bindings.

### 🔗 Dependencies

- **Modified:** `Makefile`, `docker-compose.yml`, `.env.example`, `apps/workbench-api/src/application/ports/*`, `apps/workbench-api/src/infrastructure/*`, `docs/commit-log.md`
- **Impact:** `make db-reset` resets Postgres container on port 5435 and syncs Prisma schema with zero manual steps.

---

## v0.0.14 | 2026-08-24 | refactor

**Category:** Infrastructure Services  
**Summary:** Enforce standard Postgres port 5432 across docker-compose, environment variables, and Makefile db-reset target.  
**SuggestedCommitMessage:** refactor: set Postgres port 5432 default across Docker Compose and environment config | Infrastructure Services

### 🧠 Logic & Decisions

- **The Why:** Reverted all database port mappings to standard port `5432` across `docker-compose.yml`, `.env`, `.env.example`, and `Makefile`. Updated `make db-reset` to execute schema initialization DDL directly inside the container via `docker compose exec`, guaranteeing zero host-to-container port conflicts and healthy database setup.
- **State Change:** Aligned all database connection URIs and port mappings to standard default port 5432.

### 🔗 Dependencies

- **Modified:** `docker-compose.yml`, `.env`, `.env.example`, `Makefile`, `docs/commit-log.md`
- **Impact:** Enforces standard port 5432 across Docker Compose, local environment configs, and Makefile reset automation.

---

## v0.0.15 | 2026-08-24 | fix

**Category:** Infrastructure Services  
**Summary:** Map Docker Postgres container to host port 5434 to resolve P1010 connection collision with native macOS Postgres.  
**SuggestedCommitMessage:** fix: map Docker Postgres host port to 5434 to prevent native macOS Postgres collision | Infrastructure Services

### 🧠 Logic & Decisions

- **The Why:** Fixed `PrismaClientInitializationError: User was denied access on the database (not available)` (error code `P1010`) occurring during `PrismaService.onModuleInit()`. Native PostgreSQL running on macOS (PID 744) listens on port 5432 and intercepts `localhost:5432` connections before they reach Docker Desktop. Configured `POSTGRES_PORT=5434` host mapping in `docker-compose.yml`, `.env`, `.env.example`, and `Makefile`. Containers continue communicating internally on port 5432 inside Docker Compose networks.
- **State Change:** Re-mapped Docker Postgres host port to 5434, eliminating connection collisions with native macOS Postgres.

### 🔗 Dependencies

- **Modified:** `docker-compose.yml`, `.env`, `.env.example`, `Makefile`, `docs/commit-log.md`
- **Impact:** `npm run dev:api` and `make dev` connect directly to Docker Postgres on port 5434 with zero P1010 authorization errors.

---

## v0.0.16 | 2026-08-24 | feat

**Category:** Interface Services  
**Summary:** Refine frontend auth view layout padding and remove remember session checkbox from sign in form.  
**SuggestedCommitMessage:** feat: refine auth panel layout spacing and remove remember session checkbox | Interface Services

### 🧠 Logic & Decisions

- **The Why:** Adjusted AuthPanel and AuthBrandPanel responsive padding in `apps/web/src/features/auth/AuthPanel/AuthPanel.styles.ts` (`xl:pt-36`) and `AuthBrandPanel.styles.ts` (`py-14`), and simplified `SignInForm` by removing the redundant remember session checkbox component.
- **State Change:** Streamlined authentication user interface layout and form inputs.

### 🔗 Dependencies

- **Modified:** `apps/web/src/features/auth/AuthPanel/AuthPanel.styles.ts`, `apps/web/src/features/auth/AuthBrandPanel/AuthBrandPanel.styles.ts`, `apps/web/src/features/auth/SignInForm/index.tsx`, `docs/commit-log.md`
- **Impact:** Improves auth page visual alignment and simplifies user sign-in workflow.
