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
