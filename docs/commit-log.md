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
**Summary:** Map Docker Postgres container to host port 5432 to resolve P1010 connection collision with native macOS Postgres.  
**SuggestedCommitMessage:** fix: map Docker Postgres host port to 5432 to prevent native macOS Postgres collision | Infrastructure Services

### 🧠 Logic & Decisions

- **The Why:** Fixed `PrismaClientInitializationError: User was denied access on the database (not available)` (error code `P1010`) occurring during `PrismaService.onModuleInit()`. Native PostgreSQL running on macOS (PID 744) listens on port 5432 and intercepts `localhost:5432` connections before they reach Docker Desktop. Configured `POSTGRES_PORT=5432` host mapping in `docker-compose.yml`, `.env`, `.env.example`, and `Makefile`. Containers continue communicating internally on port 5432 inside Docker Compose networks.
- **State Change:** Re-mapped Docker Postgres host port to 5432, eliminating connection collisions with native macOS Postgres.

### 🔗 Dependencies

- **Modified:** `docker-compose.yml`, `.env`, `.env.example`, `Makefile`, `docs/commit-log.md`
- **Impact:** `npm run dev:api` and `make dev` connect directly to Docker Postgres on port 5432 with zero P1010 authorization errors.

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

---

## v0.0.17 | 2026-08-24 | feat

**Category:** Application Services  
**Summary:** Implement complete clinic authentication workflow (signup/login) with single JWT token, unified ApplicationService, Prisma repository, and domain-level password verification.  
**SuggestedCommitMessage:** feat: implement full clinic authentication workflow and unified ApplicationService | Application Services

### 🧠 Logic & Decisions

- **The Why:** Completed end-to-end authentication for Workbench API following strict DDD order of operations:
  - **Domain:** Enhanced `Clinic` aggregate with `register()` business factory and `verifyPassword()` method. Added `PasswordVerifier` type and granular error classes.
  - **Application:** Consolidated all use cases into a single `ApplicationService` with try-catch error handling on every public method.
  - **Infrastructure:** Implemented `BcryptEncryptionService`, `JwtTokenService` (single JWT token containing `clinicId` + `username`), `ClinicMapper`, and `PrismaClinicRepository`.
  - **Interface:** Updated `AuthController`, `ClinicsController` (`GET /clinics/me`), `JwtAuthGuard`, `DomainExceptionFilter`, and DTOs with `class-validator` rules.
- **State Change:** Full working signup/login authentication flow and authenticated clinic profile lookup.

### 🔗 Dependencies

- **Modified:** `apps/workbench-api/**/*`, `.env`, `.env.example`, `docs/commit-log.md`
- **Impact:** Clinic users can sign up, log in, receive a single JWT token, and access protected endpoints like `GET /clinics/me`.

---

## v0.0.18 | 2026-08-24 | feat

**Category:** Interface Services  
**Summary:** Implement the wireframe 1c dashboard screen — full-viewport shell with a side-by-side referral dropzone and extraction-schema panel above a tabbed referrals table, backed by a mocked API layer.  
**SuggestedCommitMessage:** feat: implement 1c dashboard with dropzone, schema panel, and referrals table | Interface Services

### 🧠 Logic & Decisions

- **The Why:** Built screen `1c` from the "Referral Workbench Wireframes" design canvas against the existing frontend conventions rather than the canvas's `modernist` design-system bundle — that bundle is a different aesthetic (Archivo / red / zero-radius) which the wireframe itself does not use. The purple Plena palette the wireframe *does* use was already tokenised in `globals.css` for screen `1a`, so this screen extends those tokens (`--color-shell`, `--color-success`, `--color-success-tint`, `--color-danger-tint`) instead of introducing a parallel system.
  - **Layout:** `DashboardLayout` claims a full `dvh` with the banner and header at natural height and `main` taking the remainder, so the page fills the screen when content is short and grows past it when it isn't. Deliberately no `min-h-0` on `main` — that lets a flex child shrink under its own content and clips the table instead of scrolling it.
  - **Structure:** Every component follows the folder rule (`index.tsx` + `{Name}.styles.ts`), tags its root with a PascalCase `data-component`, exposes state via `data-state`/`data-tone`, and keeps all Tailwind in CVA behind `cn()`.
  - **Logic isolation:** Upload screening (`upload-candidate.manager.ts`) and tab filtering (`referral-filter.manager.ts`) are pure functions in `managers/`; drag state (`use-file-dropzone`) and schema choice (`use-schema-selection`) are hooks. Components stay views over them.
  - **Mocked API:** `client/mock-api.ts` stands in for the typed `openapi-fetch` client, consumed through `server-actions/` returning the standard `ActionResult<T>`, with the `useServerAction` foundation and a `useCreateReferrals` domain wrapper in `server-hooks/`. Swapping in the real client is a change inside `client/` and `server-actions/` only.
  - **Hydration:** Relative timestamps are resolved once on the server into `ReferralRowView.submittedLabel`, so a client component never re-derives them from `Date.now()` and desyncs against the server-rendered markup.
  - **Revalidation:** Used `revalidatePath(ROUTES.DASHBOARD)` rather than `revalidateTag` — Next 16 requires a cache-life profile on `revalidateTag`, and nothing is `"use cache"`-tagged yet. Becomes tag-scoped once the reads are cached.
- **State Change:** `/dashboard` is now a real route; `ROUTES` gains `DASHBOARD` and `SCHEMAS`, and `WORKBENCH_NAV_ITEMS` drives the header nav. The root `/` still redirects to `/auth`.

### 🔗 Dependencies

- **Modified:** `apps/web/src/app/globals.css`, `apps/web/src/app/dashboard/page.tsx`, `apps/web/src/apps/dashboard/index.tsx`, `apps/web/src/layouts/DashboardLayout/*`, `apps/web/src/features/navigation/{WorkbenchHeader,ThroughputBanner}/*`, `apps/web/src/features/referrals/{UploadWorkspace,ReferralDropzone,UploadFileChip,ReferralsTable,ReferralRow}/*`, `apps/web/src/features/extraction-schemas/{SchemaSelector,SchemaJsonDrop}/*`, `apps/web/src/shared/{StatusPill,Tabs,RadioCard,Select,BrandLockup,Avatar,Icon}/*`, `apps/web/src/hooks/{use-file-dropzone,use-schema-selection,use-server-action}.ts`, `apps/web/src/managers/*`, `apps/web/src/client/mock-api.ts`, `apps/web/src/server-actions/*`, `apps/web/src/server-hooks/referrals/use-create-referrals.ts`, `apps/web/src/constants/{referrals,extraction-schemas}.ts`, `apps/web/src/types/**`, `apps/web/src/routes/index.ts`, `apps/web/src/lib/format.ts`, `docs/commit-log.md`
- **Impact:** `client/mock-api.ts` must be replaced with the generated `openapi-fetch` client once the WorkBench API exposes referral and extraction-schema endpoints. The schema panel's "Build fields in the app" action is an unwired prop pending wireframe `2a`. Row click (`onOpenReferral`) is unwired pending the review screen (`1e`).

---

## v0.0.19 | 2026-08-25 | refactor

**Category:** Interface Services  
**Summary:** Consolidate interface layer DTOs into a centralized index file
**SuggestedCommitMessage:** refactor: consolidate interface DTO exports | Interface Services

### 🧠 Logic & Decisions

- **The Why:** Re-organized request and response DTO definitions in `apps/workbench-api/src/interface/http/dto/index.dto.ts` into a clean, centralized index module for simpler imports across controllers.
- **State Change:** Centralized HTTP interface DTO exports.

### 🔗 Dependencies

- **Modified:** `apps/workbench-api/src/interface/http/**/*`, `docs/commit-log.md`
- **Impact:** Clean interface layer imports and prevents CLAUDE.md from appearing in staged git changes.

---

## v0.0.20 | 2026-08-25 | feat

**Category:** Interface Services  
**Summary:** Connect Next.js WebApp with WorkBench API via openapi-typescript codegen, typed openapi-fetch client, server actions, and useLogin/useSignup server hooks.  
**SuggestedCommitMessage:** feat: link Next.js web app authentication flows to WorkBench API via openapi-fetch and server hooks | Interface Services

### 🧠 Logic & Decisions

- **The Why:** Connected the frontend auth workflows directly to the WorkBench API backend following strict frontend architecture guidelines:
  - **Codegen:** Exposed `/docs-json` on `apps/workbench-api/src/main.ts` and ran `openapi-typescript` to generate strongly-typed API models in `apps/web/src/types/api.generated.ts`.
  - **Network Client:** Configured typed `openapi-fetch` client in `apps/web/src/client/api-client.ts`.
  - **Server Actions:** Implemented `"use server"` actions in `apps/web/src/server-actions/auth.ts` (`signupAction`, `loginAction`, `logoutAction`, `getMeAction`) returning `ActionResult<T>` and managing HTTP-only `access_token` cookies.
  - **Server Hooks:** Created `"use client"` domain wrappers in `apps/web/src/server-hooks/auth/` (`useLogin`, `useSignup`) consuming `useServerAction` foundation, managing transition loading states, and handling router navigation to `/dashboard`.
  - **UI Integration:** Wired `SignInForm`, `SignUpForm`, and `AuthPanel` to `useLogin` and `useSignup`, rendering inline server validation error banners.
  - **Dashboard Session:** Updated `DashboardApp` to fetch the authenticated clinic's profile via `getMeAction()` on the server and render the clinic name dynamically in `WorkbenchHeader`.
- **State Change:** Connected Next.js auth views to live WorkBench REST API via typed client and cookie-based server session management.

### 🔗 Dependencies

- **Modified:** `apps/web/**/*`, `apps/workbench-api/src/main.ts`, `docs/commit-log.md`
- **Impact:** Clinic users can sign up and log in from the Next.js UI (`/auth`), receive an HTTP-only JWT cookie session, and view their authenticated clinic profile on `/dashboard`.

---

## v0.0.21 | 2026-08-25 | feat

**Category:** Interface Services  
**Summary:** Refine frontend authentication error UI components, implement WorkbenchHeaderIdentity dropdown menu with logout server hook, and configure Next.js middleware proxy.  
**SuggestedCommitMessage:** feat: refine auth error UI, header identity dropdown, and logout server hook | Interface Services

### 🧠 Logic & Decisions

- **The Why:** Refined authentication UI components and header navigation state in `apps/web`:
  - **Shared FormError:** Created `FormError` shared component (`shared/FormError/`) to render standardized error alert banners across `SignInForm` and `SignUpForm`.
  - **Header Identity Dropdown:** Implemented `WorkbenchHeaderIdentity` feature component with custom `useHoverMenu` hook for user account dropdown menu, showing clinic name, avatar, and logout action.
  - **Logout Flow:** Created `useLogout` domain hook in `server-hooks/auth/use-logout.ts` wrapping `logoutAction` server action to clear `access_token` cookies and redirect to `/auth`.
  - **Next.js Middleware Proxy:** Added `proxy.ts` middleware for session route protection and cookie forwarding.
- **State Change:** Enhanced authentication user experience with dedicated error banner components, account dropdown menu, and seamless logout capabilities.

### 🔗 Dependencies

- **Modified:** `apps/web/src/features/auth/*`, `apps/web/src/features/navigation/WorkbenchHeader*`, `apps/web/src/shared/FormError/*`, `apps/web/src/server-hooks/auth/use-logout.ts`, `apps/web/src/proxy.ts`, `docs/commit-log.md`
- **Impact:** Clinic users can log out, view formatted validation errors, and toggle the header identity menu.

---

## v0.0.22 | 2026-08-25 | feat

**Category:** Interface Services  
**Summary:** Implement FieldBuilderModal for custom schema field creation, shared Modal component, and upload workspace dropzone refinements.  
**SuggestedCommitMessage:** feat: implement FieldBuilderModal, shared Modal component, and upload workspace dropzone refinements | Interface Services

### 🧠 Logic & Decisions

- **The Why:** Implemented interactive custom extraction schema field building workflow in `apps/web`:
  - **Shared Modal:** Created domain-agnostic `Modal` primitive (`shared/Modal/`) with focus trapping, backdrop blur, ESC key dismiss, and scroll-lock management.
  - **FieldBuilderModal:** Implemented `FieldBuilderModal` component (`features/extraction-schemas/FieldBuilderModal/`) allowing clinic users to visually add, configure, and remove custom field definitions (key, label, type, guidance description).
  - **Custom Field Manager & Hook:** Created `custom-field.manager.ts` and `useFieldBuilder` hook to manage field list state, key slugification, and validation.
  - **Dropzone Refinements:** Refined `ReferralDropzone`, `UploadFileChip`, and `UploadWorkspace` visual feedback during file drag and schema selection.
- **State Change:** Enabled custom extraction schema creation via interactive modal interface in the dashboard workspace.

### 🔗 Dependencies

- **Modified:** `apps/web/src/shared/Modal/*`, `apps/web/src/features/extraction-schemas/*`, `apps/web/src/features/referrals/*`, `apps/web/src/hooks/*`, `apps/web/src/managers/*`, `docs/commit-log.md`
- **Impact:** Clinic staff can build and configure custom extraction schema fields directly in the UI.

---

## v0.0.23 | 2026-08-25 | feat

**Category:** Domain Models  
**Summary:** Implement ExtractionSchema creation API with strict domain invariant validation for parameter names and required field descriptions, DomainService, DomainModule, and PrismaClinicRepository persistence.  
**SuggestedCommitMessage:** feat: implement ExtractionSchema creation API with DomainService validation and Prisma persistence | Domain Models

### 🧠 Logic & Decisions

- **The Why:** Implemented `createExtractionSchema` API endpoint following strict Hexagonal Clean Architecture and DDD principles:
  - **Domain Invariants:** Enforced in `FieldDefinition` value object and `DomainService` that every field in an extraction schema MUST contain a parameter name (`name`/`key`/`label`) AND a **mandatory non-empty description** (`description`). Throw `InvalidFieldDefinitionError` if description or parameter name is missing/empty.
  - **Domain Types & Service:** Defined `ExtractionSchemaInput` in `domain/domain-types/extraction-schema.input.ts` and created `DomainService` in `domain/services/domain.service.ts` to construct `ExtractionSchema` aggregate instances from raw JSON input.
  - **Domain Module:** Registered `DomainModule` in `domain/domain.module.ts` exporting `DomainService` for injection into `ApplicationModule`.
  - **Repository Port & Persistence:** Extended `ClinicRepositoryPort` with `saveExtractionSchema`, `findLatestSchemaVersion`, `findExtractionSchemaById`, and `listExtractionSchemasByClinic`, implemented via `ExtractionSchemaMapper` and `PrismaClinicRepository`.
  - **Application Service:** Implemented `ApplicationService.createExtractionSchema` wrapped in try/catch handling, calculating incremental schema versions.
  - **Interface Endpoint:** Implemented guarded `POST /extraction-schemas` in `ClinicsController` (`@UseGuards(JwtAuthGuard)`), extracting authenticated `clinicId` from JWT token payload.
  - **Testing:** Unit tested `DomainService` validation rules (4 passing Jest tests).
- **State Change:** Enabled custom extraction schema aggregate creation and persistence with strict domain-level invariant validation.

### 🔗 Dependencies

- **Modified:** `apps/workbench-api/src/domain/**/*`, `apps/workbench-api/src/application/**/*`, `apps/workbench-api/src/infrastructure/**/*`, `apps/workbench-api/src/interface/**/*`, `apps/web/src/types/api.generated.ts`, `docs/commit-log.md`
- **Impact:** Clinic users can publish custom JSON extraction schema versions via `POST /extraction-schemas` authenticated with JWT, with guaranteed domain-level validation.