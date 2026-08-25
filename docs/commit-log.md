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

---

## v0.0.24 | 2026-08-25 | refactor

**Category:** Domain Models  
**Summary:** Refactor Clinic and ExtractionSchema aggregates to props-based constructors with self-validating invariants, and connect frontend FieldBuilderModal to extraction-schema API endpoints.  
**SuggestedCommitMessage:** refactor: standardize aggregate props constructors and integrate frontend extraction-schema creation | Domain Models

### 🧠 Logic & Decisions

- **The Why:** Standardized aggregate root construction across `apps/workbench-api` (`Clinic` and `ExtractionSchema`) by replacing positional constructors and external domain static factory methods with props-based constructors (`new Clinic(props)`, `new ExtractionSchema(props)`). All domain invariants (clinic name non-empty check, username regex `/^[a-zA-Z0-9_]{3,50}$/`, raw password strength, non-empty field parameter names, and mandatory Gemini LLM field descriptions) are self-validated directly within aggregate constructors upon instantiation.
- **State Change:** Refactored `ApplicationService.signup`, `ApplicationService.createExtractionSchema`, and mapper classes (`ClinicMapper`, `ExtractionSchemaMapper`) to instantiate aggregates directly via `new Aggregate(props)`. Connected `FieldBuilderModal` and `SchemaJsonDrop` in `apps/web` to publish custom schemas directly to `POST /extraction-schemas` via `useCreateExtractionSchema` server hooks.

### 🔗 Dependencies

- **Modified:** `apps/workbench-api/src/domain/clinic/clinic.aggregate.ts`, `apps/workbench-api/src/domain/extraction-schema/extraction-schema.aggregate.ts`, `apps/workbench-api/src/application/application.service.ts`, `apps/workbench-api/src/infrastructure/repository/clinic.mapper.ts`, `apps/web/src/features/extraction-schemas/**/*`, `apps/web/src/server-hooks/extraction-schemas/**/*`, `docs/commit-log.md`
- **Impact:** Ensures consistent domain aggregate creation rules across `workbench-api` services while enabling real-time extraction schema creation and JSON upload in the `apps/web` UI.
---

## v0.0.25 | 2026-08-25 | feat

**Category:** Application Services  
**Summary:** Implement `createNewReferralWithAttachedPresignedUrl` — the referral upload-slot endpoint that resolves the extraction schema, persists an `AWAITING_UPLOAD` referral, and issues a presigned S3 PUT URL against real AWS.  
**SuggestedCommitMessage:** feat: implement referral upload-slot API with S3 presigned URLs and DDD-compliant Referral aggregate | Application Services

### 🧠 Logic & Decisions

- **The Why:** Implemented step 2 of the design doc's upload flow ("Request Upload Slot") end-to-end following the same DDD data-update flow and props-constructor convention `v0.0.24` established for `Clinic`/`ExtractionSchema`:
  - **Referral aggregate standardized:** Replaced `Referral`'s 10-positional-parameter constructor + `static create()` with a single props-based `constructor(props)`, matching `ExtractionSchema`. `patientName` is now nullable (unknown until extraction resolves one) and a required `fileName` (must end `.pdf`) was added — it drives the S3 key. Self-generates its `id` via new `ReferralId.generate()` when absent.
  - **S3 key convention owned by the storage adapter, not the domain:** Added `StoragePort.buildReferralPdfKey(clinicId, referralId)`, implemented on `S3StorageService`, producing `referrals/{clinicId}/{referralId}.pdf` — matches what `apps/agent_worker` expects to parse back out of the object key. Deliberately kept off the `S3Object` value object and `Referral` aggregate: the convention is a storage-layout decision with no business invariant to protect, and it's fully derivable from the two ids already passed to the storage call site, so giving the domain a static factory for it would have been ceremony without payoff.
  - **Repository port renamed for clarity:** Per explicit instruction, `ReferralRepositoryPort` methods now say what they find/save: `findReferralById`, `findReferralByIdForClinic`, `findPaginatedReferralsByClinicId`, `saveReferral` (was `findById`/`findByIdForClinic`/`listByClinicId`/`save`).
  - **Schema resolution order:** explicit `extractionSchemaId` override → `clinicRepository.findExtractionSchemaById` (rejecting a schema owned by another clinic as not-found, preserving tenant isolation) → the clinic's `defaultExtractionSchemaId` → `null` (signals the worker's built-in default LLM field set). The **resolved** id is what gets persisted, never just what was requested.
  - **Real AWS everywhere, no emulator:** `S3StorageService` now wraps `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`, signing against real S3 in every environment (local dev included) — no LocalStack/MinIO, no `endpoint`/`forcePathStyle` override. Fails loudly at construction if `S3_BUCKET_NAME` is unset rather than defaulting silently. Persist-then-presign ordering ensures a failed insert never hands out a live upload URL. 20MB enforcement is deliberately deferred to the client-side `upload-candidate.manager.ts` screen and the worker's sanity check — the presign only pins `ContentType: application/pdf`.
  - **DDD flow order preserved:** resolve schema → build VOs (`ReferralId`, `S3Object`) → construct `new Referral(props)` → persist via `saveReferral` → presign. No anemic "shell" aggregate was constructed for the ORM call.
  - **Interface layer:** `CreateReferralRequest` now validates `fileName`/`patientName`/`extractionSchemaId` (global `forbidNonWhitelisted: true` requires every property decorated); added `ReferralDto`/`PresignedUploadDto`/`CreateReferralResponseDto` with `fromDomain` mappers; controller handler renamed to `createNewReferralWithAttachedPresignedUrl`, extracting `clinicId` from the JWT via the same `@Req() req: AuthenticatedRequest` pattern as `createSchema`. `DomainExceptionFilter` gained mappings for `SCHEMA_NOT_FOUND`/`REFERRAL_NOT_FOUND` (404) and the referral state-machine codes (409).
  - **Persistence:** Added `referral.mapper.ts` (new) mirroring `extraction-schema.mapper.ts`'s `toDomain`/`toPersistence` shape, rebuilding `ExtractedField`/`BoundingBox` VOs from stored JSON. Implemented all four `PrismaReferralRepository` methods against the same upsert-on-id pattern as `PrismaClinicRepository`. `prisma/schema.prisma`'s `Referral.patientName` became nullable and a `fileName` column was added.
  - **Testing:** Added `referral.aggregate.spec.ts` and `s3-object.value-object.spec.ts` covering construction defaults and the nullable-`patientName`/required-`.pdf`-`fileName` invariants, plus `s3-storage.service.spec.ts` covering the `buildReferralPdfKey` convention and the fail-loudly-on-missing-bucket guard (13 new passing Jest tests).
- **State Change:** `POST /referrals` now creates a real `AWAITING_UPLOAD` referral row and returns a working presigned S3 PUT URL instead of throwing `NotImplementedError`.

### 🔗 Dependencies

- **Modified:** `prisma/schema.prisma`, `.env.example`, `apps/workbench-api/package.json`, `apps/workbench-api/src/domain/referral/**/*`, `apps/workbench-api/src/domain/shared/ids/referral-id.value-object.ts`, `apps/workbench-api/src/application/application.service.ts`, `apps/workbench-api/src/application/ports/referral-repository.port.ts`, `apps/workbench-api/src/application/ports/storage.port.ts`, `apps/workbench-api/src/infrastructure/repository/referral.mapper.ts`, `apps/workbench-api/src/infrastructure/repository/referral.repository.ts`, `apps/workbench-api/src/infrastructure/storage/s3-storage.service.ts`, `apps/workbench-api/src/interface/http/dto/index.dto.ts`, `apps/workbench-api/src/interface/http/clinics/clinics.controller.ts`, `apps/workbench-api/src/interface/http/filters/domain-exception.filter.ts`, `docs/commit-log.md`
- **Impact:** Requires a real, reachable S3 bucket (`S3_BUCKET_NAME`) with `s3:PutObject`/`s3:GetObject` granted to the configured IAM user and a CORS rule allowing the web app's origin — there is no local emulator fallback. `apps/web` still calls the mocked upload flow in `client/mock-api.ts` and was intentionally not wired to this endpoint in this change; its `types/api.generated.ts` was not regenerated.

---

## v0.0.26 | 2026-08-25 | feat | Batch Referral Upload

**Category:** Application Services  
**Summary:** Implement batch referral creation API with atomic persistence, single-schema resolution 
**SuggestedCommitMessage:** feat: implement batch referral creation API with atomic persistence | Application Services

### 🧠 Logic & Decisions

- **The Why:** Refactored referral upload slot creation (`POST /referrals`) to support batch file processing in a single API call:
  - **Batch Command & DTO:** Created `CreateReferralsRequest` / `CreateReferralItemRequest` DTOs accepting an array of files (`files`) with a shared `extractionSchemaId` override.
  - **Single Schema Resolution:** Resolved `extractionSchemaId` once per batch rather than per file, avoiding redundant DB lookups.
  - **Fail-Fast Aggregates:** Constructed all `Referral` aggregates upfront so any file validation error (e.g. invalid file extension) aborts the entire batch before storage presigning or DB writes.
  - **Atomic Persistence:** Added `saveReferrals(referrals: Referral[])` to `ReferralRepositoryPort` and `PrismaReferralRepository` executing Prisma transaction batch upserts.
  - **Unit Testing:** Created comprehensive unit test suite in `application.service.spec.ts` covering batch presigned upload flows and error handling.
- **State Change:** `POST /referrals` accepts batch file uploads and returns an array of presigned S3 upload slot objects in request order.

### 🔗 Dependencies

- **Modified:** `apps/workbench-api/src/application/application.service.ts`, `apps/workbench-api/src/application/application.service.spec.ts`, `apps/workbench-api/src/application/ports/referral-repository.port.ts`, `apps/workbench-api/src/infrastructure/repository/referral.repository.ts`, `apps/workbench-api/src/interface/http/clinics/clinics.controller.ts`, `apps/workbench-api/src/interface/http/dto/index.dto.ts`, `apps/workbench-api/src/domain/shared/ids/referral-id.value-object.ts`
- **Impact:** `POST /referrals` returns `CreateReferralResponseDto[]` array instead of single object to support multi-file batch uploads from the dashboard UI.


---

## v0.0.27 | 2026-08-25 | feat

**Category:** Infrastructure Services  
**Summary:** Implement Redis cache-aside for referral metadata (design-doc step 3) — `CachingServicePort` + `RedisService` write a `{fileName, extractionSchema}` hash per referral at creation time, fail-closed with fast-fail retry config.  
**SuggestedCommitMessage:** feat: implement Redis cache-aside for referral metadata via CachingServicePort | Infrastructure Services

### 🧠 Logic & Decisions

- **The Why:** `docs/product_solution_design.md` step 3 specifies a Redis hash `referral:{referral_id}` → `{fileName, extractionSchema}` written at referral-creation time, so the worker can recover both the original file name and the resolved schema in one O(1) lookup — neither survives into the S3 object key (`referrals/{clinicId}/{referralId}.pdf`) or the SQS message built from it. This was previously undesigned; the whole layer was greenfield (no Redis client installed, no cache code anywhere in the repo).
  - **Port added:** `application/ports/caching.port.ts` — `CachingServicePort.setManyReferralCaches`/`getReferralCache`, mirroring `storage.port.ts`'s shape (token + ancillary types co-located). `CachedExtractionSchema` mirrors `ExtractionSchemaMapper.toPersistence`'s field shape so the worker can rehydrate a `FieldDefinitionInput[]` without translation.
  - **Adapter added:** `infrastructure/caching/redis.service.ts` (`RedisService`, `ioredis`) — combines the `S3StorageService` constructor `process.env` validation precedent with `PrismaService`'s `OnModuleInit`/`OnModuleDestroy` lifecycle. `setManyReferralCaches` uses one pipelined round-trip and explicitly scans `pipeline.exec()`'s `[error, result]` tuples for per-command failures, since ioredis never rejects a pipeline call on a single failed command — a silent failure there would leave a referral row with no corresponding cache entry and nothing would ever surface it.
  - **Fail-closed, by explicit decision:** a Redis write failure fails the whole `POST /referrals` request rather than degrading silently. Write order is presign → persist (Postgres) → cache (Redis) → throw on cache failure, chosen over cache-first specifically because cache-first would leak permanent orphan keys on a DB failure (no TTL), whereas DB-first's failure mode — an orphan `AWAITING_UPLOAD` row — is a state the system must already tolerate (identical to a user abandoning an upload before PUTting).
  - **Fail FAST, not just fail closed:** ioredis's defaults (`maxRetriesPerRequest: 20`, growing backoff) turned "fail closed" into "hang for tens of seconds" when Redis was down — verified live by stopping the Redis container and watching a request hang past 30s. Fixed with `maxRetriesPerRequest: 2` + `connectTimeout: 3000`; a request to a down Redis now fails in ~9s instead. Verified reconnection is automatic once Redis comes back (no manual restart needed).
  - **`onModuleInit` does not crash the app:** initially mirrored `PrismaService` (throw if unreachable at boot), but reconsidered — Redis is a hard dependency of referral *creation* specifically, not of the whole API (auth and schema management never touch it), so crashing every endpoint over a Redis outage at boot would over-scope the fail-closed policy the user actually asked for. `onModuleInit` now logs a non-fatal warning; the real guarantee is enforced per-call in `setManyReferralCaches`.
  - **`resolveExtractionSchemaId` → `resolveExtractionSchema`:** refactored to return the full `ExtractionSchema` aggregate instead of just its id. The explicit-override path already loaded the full aggregate and discarded it (`findExtractionSchemaById`) — returning it is free. The clinic-default path gained one extra lookup (once per batch, not per file) since only the id was previously available.
  - **No TTL, full field definitions cached** (not just the schema id) — both explicit product decisions, so the worker needs zero Postgres round-trips to get schema field definitions.
- **State Change:** `POST /referrals` now writes one Redis hash per created referral before returning; a Redis outage makes referral creation fail with a 500 (fast) rather than silently skip the cache-aside step.

### 🔗 Dependencies

- **Modified:** `apps/workbench-api/package.json` (+`ioredis`), `apps/workbench-api/src/application/ports/caching.port.ts` (new), `apps/workbench-api/src/infrastructure/caching/redis.service.ts` (new), `apps/workbench-api/src/infrastructure/infrastructure.module.ts`, `apps/workbench-api/src/application/application.service.ts`, `apps/workbench-api/src/application/application.service.spec.ts`, `apps/workbench-api/src/interface/http/clinics/clinics.controller.ts` (removed a debug `console.log`)
- **Impact:** `docker compose up -d redis` (or `REDIS_URL` pointed at a reachable instance) is now a hard requirement for `POST /referrals` to succeed — verified via live testing: batch creation, Redis hash content (both null-schema and full-schema-definition cases), fail-closed behavior, and automatic reconnection. Full S3-object-landing verification is blocked by an AWS IAM permissions gap unrelated to this change (see next entry).

---

## v0.0.28 | 2026-08-25 | feat

**Category:** Interface Services  
**Summary:** Wire the dashboard's multi-file upload flow to the real batch `POST /referrals` API and direct-to-S3 browser uploads — `apps/web` no longer routes referral creation through `client/mock-api.ts`.  
**SuggestedCommitMessage:** feat: integrate batch referral upload with direct-to-S3 browser PUT and per-file progress UI | Interface Services

### 🧠 Logic & Decisions

- **The Why:** The dashboard dropzone already let a clinic stage many PDFs before submit, but `createReferrals` only ever called a fake mock — no real referral rows, no real S3 uploads, and the actual `File` objects were discarded before the server action even saw them. Closing this required regenerating stale OpenAPI types and a genuinely new architectural piece: direct-to-S3 upload, which did not exist anywhere in `apps/web` (repo-wide grep for `presign`/`PUT`/`fetch(` returned nothing beyond doc comments).
  - **Regenerated `types/api.generated.ts`** (`npm run codegen:api`) — it was stale, still typing the old single-file request and `content?: never` on the response, which would have silently accepted a body shape the backend no longer serves.
  - **`managers/direct-upload.manager.ts` (new):** pure functions — `matchSlotsToCandidates` (pairs presigned slots to local candidates by file name; both sides are already name-unique within a batch) and `putReferralFile` (the actual browser `fetch(..., {method:'PUT'})`). `Content-Type` is hardcoded to `REFERRAL_ACCEPTED_MIME_TYPE`, deliberately never `candidate.file.type` — the backend bakes `ContentType: 'application/pdf'` into the SigV4 signature, so any other value causes S3 to reject with `403 SignatureDoesNotMatch`.
  - **`hooks/use-direct-file-uploads.ts` (new):** wraps the PUT fan-out via `Promise.allSettled` so one failed file never aborts the rest; lives in `hooks/` (not `server-hooks/`) — same rule `useReferralStatusStream` follows, since it wraps a browser API, not a Server Action. Plain `useState`, no Zustand — confirmed not a dependency anywhere in `apps/web`, and this state is fully local to one component subtree.
  - **`server-actions/referrals.ts` rewritten:** `createReferrals` now follows the exact cookie→Bearer→`apiClient` pattern already established in `extraction-schemas.ts`, POSTing the batch and returning presigned slots — it does not PUT any bytes itself, preserving the design doc's "the server tier never becomes a bandwidth bottleneck" requirement. `getReferralRows`/`getThroughputStats` deliberately still read the mock — `GET /referrals` remains an unimplemented backend stub, so the dashboard table will keep showing mock rows even though real rows now exist in Postgres.
  - **`server-hooks/referrals/use-create-referrals.ts` rewritten as a two-phase orchestrator**, deliberately dropping the generic `useServerAction` wrapper: that hook's `execute` is fire-and-forget (returns `void`) and its `isLoading` flips false the instant the action resolves — before any S3 PUT has even started. A create-then-PUT sequence needs state that spans both phases.
  - **Per-file upload status UI, not just an aggregate banner** (explicit product decision): `UploadFileChip` gained an `uploadStatus` prop overriding its tone/meta during `uploading`/`done`/`error`, reusing the existing `accepted`/`rejected` CVA tones (no new variant needed). `UploadWorkspace` now dequeues each candidate individually via `onFileUploaded` the moment its PUT succeeds, replacing the old blanket `dropzone.clear()` — so a partially-failed batch leaves only the failed files staged for retry, exactly as required.
  - **Fixed a downstream gap surfaced by the compiler:** adding `AWAITING_UPLOAD` to `REFERRAL_STATUSES`/`REFERRAL_STATUS_LABELS` (the real initial status the backend now returns) broke `ReferralRow`'s exhaustive `STATUS_TONES` map — added a `"neutral"` tone, matching `PENDING`'s inert-state treatment.
- **State Change:** Submitting the upload form now creates real `AWAITING_UPLOAD` referral rows via one batch POST, then PUTs every file directly from the browser to S3 — verified end-to-end against the real backend (batch creation, Redis cache population) up through the actual S3 PUT, which is currently blocked by an AWS IAM permissions gap (see Impact).

### 🔗 Dependencies

- **Modified:** `apps/web/src/types/api.generated.ts` (regenerated), `apps/web/src/types/referrals/referral.ts`, `apps/web/src/constants/referrals.ts`, `apps/web/src/managers/direct-upload.manager.ts` (new), `apps/web/src/hooks/use-direct-file-uploads.ts` (new), `apps/web/src/server-actions/referrals.ts`, `apps/web/src/server-hooks/referrals/use-create-referrals.ts`, `apps/web/src/features/referrals/UploadWorkspace/index.tsx`, `apps/web/src/features/referrals/ReferralDropzone/index.tsx`, `apps/web/src/features/referrals/UploadFileChip/index.tsx`, `apps/web/src/features/referrals/ReferralRow/index.tsx`
- **Impact:** `client/mock-api.ts`'s `submitReferralUpload`/`MockUploadAcceptance` are now dead code for the create path (still used by `getReferralRows`/`getThroughputStats`, which stay mocked pending `GET /referrals`). **Verification gap:** the presigned-URL PUT itself was confirmed correctly *signed* (S3 validates the SigV4 signature before authorization) but rejected with `403 AccessDenied` — the IAM user `workbench-sdk-admin` lacks `s3:PutObject` on the bucket ("no permissions boundary allows the s3:PutObject action"). This is an AWS account configuration issue outside application code; granting the IAM permission is a prerequisite for the final "files land in S3" step. Browser-level UI verification (drag-drop, per-chip progress) was also not possible this session — no Claude-in-Chrome extension was connected — so the flow is verified via direct backend calls and a clean `next build`/`eslint` pass, not a live click-through.

---

## v0.0.29 | 2026-08-25 | feat

**Category:** Interface Services  
**Summary:** Turn the submit button into an animated progress bar (0→100%, color-shifting, holds on "Documents uploaded" for 500ms) and make per-file upload labels larger and color-coded, tied to the same live progress signal.  
**SuggestedCommitMessage:** feat: add animated upload progress bar and larger per-file status labels | Interface Services

### 🧠 Logic & Decisions

- **The Why:** The batch upload flow worked but gave no visible sense of progress across a multi-file batch — the submit button just said "Uploading…" with no percentage, and per-file chip labels were a small 11.5px caption easy to miss. Requested design: the file label made larger/more visible, and the submit button becoming a progress bar (10%, 20%, ... 100%, "documents uploaded" for 500ms, then reset).
  - **Fixed a real bug this surfaced:** `useDirectFileUploads.run` was updating all file statuses in a single batch *after* `Promise.allSettled` resolved every PUT — meaning progress could never actually animate incrementally, it would jump straight from 0% to 100%. Rewrote it to update each candidate's status the instant *its own* PUT settles (`Promise.all` with per-item `.then`-style updates inside the mapped callback), which is what makes genuine incremental percentages possible.
  - **`useCreateReferrals` gained phase/progress tracking:** new `UploadPhase = "idle" | "creating" | "uploading" | "complete"`, `progressPercent` (derived from settled-count / total-count in the current batch, scoped correctly by calling `directUploads.reset()` at the start of every `execute()` so a prior batch's statuses never leak into the new percentage), and `hasErrors`. `phase` auto-reverts `"complete" → "idle"` after a 500ms `setTimeout`, cleaned up on unmount via a ref.
  - **New `UploadProgressButton` component** (`features/referrals/UploadProgressButton/`): a button with an absolutely-positioned fill layer whose `width` is the live percentage and whose color transitions brand-purple (in progress) → success-green or danger-red at completion (tinted red if any file in the batch failed) — imported into `SchemaSelector` via the `@/features/...` alias since the two components live in different `features/` subfolders (a relative `../` import doesn't cross that boundary). Reuses the existing `CheckIcon` for the completed state rather than adding a new asset.
  - **`UploadFileChip` meta label bumped from 11.5px to 12.5px and made semibold**, and gained a color tie-in to the same progress signal: brand-purple while `uploading`, success-green once `done` (layered on top of the existing `accepted`/`rejected` CVA tone via `cn()`, not new CVA variants, since `tailwind-merge` already resolves the conflicting `text-*` utility correctly).
  - **Verified live in the actual browser** (Claude-in-Chrome, not just build/lint): signed up a fresh test clinic (the previously logged-in session held a JWT for a clinic id that no longer existed after an earlier `prisma db push --force-reset` in this session — unrelated stale-session issue, not a code bug), uploaded a 4-file batch, and captured the button correctly at "Uploading… 25%" with the purple fill bar exactly 1/4 filled and chips showing "Uploading…" (purple) / "Uploaded" (green) simultaneously. Confirmed the full cycle completes and the button/dropzone correctly reset to idle afterward, and confirmed all referral rows were actually persisted in Postgres. The literal 100%/"Documents uploaded" frame wasn't caught in a screenshot (the 500ms hold window is narrower than this tool's screenshot round-trip latency), but the reset-to-idle behavior after it proves the hold-then-revert cycle ran correctly.
- **State Change:** Submitting a batch now shows live, per-file-driven progress on the button (not just a static "Uploading…" label), and file labels are more prominent and color-matched to their live status.

### 🔗 Dependencies

- **Modified:** `apps/web/src/hooks/use-direct-file-uploads.ts`, `apps/web/src/server-hooks/referrals/use-create-referrals.ts`, `apps/web/src/features/referrals/UploadProgressButton/index.tsx` (new), `apps/web/src/features/referrals/UploadProgressButton/UploadProgressButton.styles.ts` (new), `apps/web/src/features/extraction-schemas/SchemaSelector/index.tsx`, `apps/web/src/features/referrals/UploadFileChip/index.tsx`, `apps/web/src/features/referrals/UploadFileChip/UploadFileChip.styles.ts`
- **Impact:** `SchemaSelectorProps.isSubmitting` was removed in favor of `phase`/`progressPercent`/`hasErrors` — any other caller of `SchemaSelector` (there is currently only `UploadWorkspace`) would need updating to the new props.

---

## v0.0.30 | 2026-08-25 | refactor

**Category:** Interface Services  
**Summary:** Switch the browser-to-S3 upload from `fetch` to `axios` for real byte-level progress, and consolidate all upload+progress logic into one hook, `useCustomUploadFilesToPresignedUrlsWithProgress`.  
**SuggestedCommitMessage:** refactor: consolidate upload logic into useCustomUploadFilesToPresignedUrlsWithProgress with real axios progress | Interface Services

### 🧠 Logic & Decisions

- **The Why:** The previous progress model (`useDirectFileUploads`) only tracked discrete per-file states (`idle`/`uploading`/`done`/`error`) — the submit button's percentage was derived from *how many files had finished*, not real bytes transferred. Requested: swap to `axios` with `onUploadProgress` for genuine byte-level percentages, and pull all the upload-execution logic (the PUT call, the per-file progress state, the aggregate math) into a single dedicated hook.
  - **New hook, `useCustomUploadFilesToPresignedUrlsWithProgress`** (`apps/web/src/hooks/`) replaces `useDirectFileUploads` entirely. It owns the `axios.put(...)` call per file, reads `progressEvent.loaded`/`progressEvent.total` in `onUploadProgress` to compute each file's own 0-100%, and exposes `overallPercent` as a plain average across every file in the batch — equal weight per file regardless of size, matching the brief's own example (2 files → each worth 50%; one at 20% with the other untouched reads as 10% overall).
  - **Kept the `Content-Type` constraint from the prior design, deliberately diverging from the requester's example snippet:** their sample used `file.type` for the header; ours stays hardcoded to `REFERRAL_ACCEPTED_MIME_TYPE` (`application/pdf`) because `S3StorageService` bakes that exact value into the SigV4 signature server-side — sending the browser-sniffed MIME type instead would produce a `403 SignatureDoesNotMatch`.
  - **Hook name corrected to lowercase `use...`:** the brief wrote `UseCustomUploadFilesToPresignedUrlsWithProgress` (capital U); renamed to `useCustomUploadFilesToPresignedUrlsWithProgress` since `eslint-plugin-react-hooks`'s rules-of-hooks only recognizes an identifier as a hook (and applies the Rules of Hooks lint checks to it) when it starts with a lowercase `use`.
  - **On a failed PUT, the file's last-known percent is preserved rather than reset to 0** — the failure is conveyed by `status`/`error`, not by erasing the progress the browser actually made sending bytes before the failure.
  - **`useCreateReferrals` simplified:** dropped its own `totalCount`/`settledCount` bookkeeping entirely, since `overallPercent` now comes pre-computed from the new hook. `direct-upload.manager.ts` was trimmed back to just `matchSlotsToCandidates` (pure data correlation) — the actual upload execution (`putReferralFile`, fetch-based) was deleted, folded into the new hook's axios call instead, per the request that upload logic live entirely in the hook.
  - **`UploadFileChip` now shows the real number**, e.g. "Uploading… 42%", instead of a static "Uploading…" — the per-file percentage was already being computed, so surfacing it on the chip (not just the aggregate button) was a natural, near-zero-cost extension consistent with the earlier "make the file label visible" ask.
  - **Verified live in the browser** (not just build/lint): uploaded a 2-file batch and captured two key frames — mid-upload with one file at "Uploaded" (green) and the other at "Uploading… 100%" (purple) with the aggregate bar correspondingly full, and the "✓ Documents uploaded" complete state (teal-green fill, checkmark icon) that a prior verification pass had only inferred from the reset behavior, never actually observed. Confirmed the referral rows for both runs landed in Postgres.
- **State Change:** Per-file and aggregate upload progress are now driven by actual bytes transferred, not file-completion counts; all upload-execution logic lives in one hook instead of being split across a hook and a manager.

### 🔗 Dependencies

- **Modified:** `apps/web/package.json` (+`axios`), `apps/web/src/hooks/use-custom-upload-files-to-presigned-urls-with-progress.ts` (new, replaces deleted `use-direct-file-uploads.ts`), `apps/web/src/managers/direct-upload.manager.ts` (trimmed to `matchSlotsToCandidates` only), `apps/web/src/server-hooks/referrals/use-create-referrals.ts`, `apps/web/src/features/referrals/UploadFileChip/index.tsx`, `apps/web/src/features/referrals/ReferralDropzone/index.tsx`, `apps/web/src/server-actions/referrals.ts` (stale doc-comment reference)
- **Impact:** None outside `apps/web` — this is a client-side-only refactor of the upload transport and progress bookkeeping; the `POST /referrals` contract and the S3 presigned-URL shape are unchanged.

---

## v0.0.31 | 2026-08-26 | feat | AGENT WORKER DAEMON

**Category:** Infrastructure Services  
**Summary:** Implement the complete Agent Worker daemon per `apps/agent_worker/plan.md` — SQS consumer → S3 download → pre-validation → Gemini 2.5 Flash extraction → normalized `extracted_payload` write-back — plus the shared `REJECTED` status enum and Docker/healthcheck wiring.  
**SuggestedCommitMessage:** feat: implement agent_worker extraction daemon per plan | Infrastructure Services

### 🧠 Logic & Decisions

- **The Why:** The worker is the third service in the design doc's data path (client → S3 → SQS → worker → Postgres → SSE) and was previously a stub (`index.ts` only handled signals). Per the plan's lean mandate it is a plain Node + TypeScript daemon — no NestJS, no HTTP framework, only outbound calls — with a flat `clients/` + `extraction/` layering instead of DDD ports/repositories.
  - **Dedup without a Redis Set (§2.8):** idempotency comes from an atomic conditional DB claim — `updateMany` where `status IN (AWAITING_UPLOAD, PENDING)` → `PROCESSING`; a `0` count means another consumer already claimed or the referral is terminal, so the worker skips Gemini and the SQS message is deleted. Postgres is the single source of truth; no in-processing Redis set needed. Delete-after-commit turns SQS at-least-once into effectively-once extraction.
  - **`REJECTED` status added to the shared schema:** content-level rejection (not a referral, unreadable) is a terminal, non-retried state with the message deleted, distinct from system `FAILED` which leaves the message for visibility-timeout redelivery → DLQ. Required adding `REJECTED` to `prisma/schema.prisma`'s enum and to workbench-api's `ReferralStatusValue`/`ALLOWED_TRANSITIONS` (`PROCESSING → REJECTED`, terminal).
  - **Cross-service payload contracts enforced in `payload-normalizer`:** LLM emits `[ymin, xmin, ymax, xmax]` bounding boxes and is prompted for 1-indexed `pageNumber`; the normalizer re-maps bbox to `{xmin, ymin, xmax, ymax}` and validates `pageNumber` as `int ≥ 1` via zod — both required to satisfy workbench-api's `ExtractedField`/`BoundingBox` value objects, which re-validate the stored JSONB on every read. Malformed/missing bboxes degrade to `null` per field (graceful degradation), never failing the whole extraction.
  - **Redis is read-only + fallback:** `referral:{id}` cache is read in O(1); on a cache miss the worker falls back to Postgres (`fileName`/`extractionSchemaId`) so a Redis blip never fails a job. The clinic secondary-index `SADD` runs best-effort after the `COMPLETED` commit and never fails the job.
  - **Replaced `@google/adk` with direct `@google/genai`** (a single extraction call doesn't earn a framework) and **removed the example-file test harness** (`run-agent.ts`, `example-files.ts`, `examples/`) entirely on request; `typecheck`/`lint` are both `tsc --noEmit`, the worker's only static gate.
  - **Env zod-validated at boot** (fail fast) and **Gemini output zod-validated**; `Dockerfile.dev` gained `prisma generate` (postinstall can't see the schema during manifest-only COPY), `docker-compose.yml` gained the worker's healthcheck on port 8002, `.env.example` gained `WORKER_PORT`.
- **State Change:** A functional background extraction daemon now exists (previously a stub), the shared DB enum now includes `REJECTED` (requires `make db-apply-migrations`/`prisma db push`), and `COMPLETED` referrals are written with 1-indexed pages and `{xmin,ymin,xmax,ymax}` bounding boxes for the review UI.

### 🔗 Dependencies

- **Modified:** `apps/agent_worker/src/**` (new `config/env.config.ts`, `types/*`, `clients/{aws,database,cache,ai}/*`, `extraction/*`, `server/healthcheck.ts`, rewritten `index.ts`), `apps/agent_worker/package.json`, `apps/agent_worker/plan.md` (new), `prisma/schema.prisma` (+`REJECTED`), `apps/workbench-api/src/domain/referral/referral-status.value-object.ts` (+`REJECTED`, +`PROCESSING → REJECTED`), `docker-compose.yml`, `docker/Dockerfile.dev`, `.env.example` (+`WORKER_PORT`), `Makefile`, `package-lock.json`
- **Impact:** workbench-api must push the new enum (`make db-apply-migrations`) before any worker write can set `REJECTED`; the worker now requires `SQS_QUEUE_URL`, `S3_BUCKET_NAME`, `DATABASE_URL`, `GEMINI_API_KEY` at boot (zod fail-fast); the compose worker service exposes `8002/healthz`; the review UI now consumes 1-indexed `pageNumber` and `{xmin,ymin,xmax,ymax}` bboxes from `COMPLETED` referrals.

---

## v0.0.32 | 2026-08-26 | feat | REALTIME STREAM PIPELINE

**Category:** System Architecture  
**Summary:** Implement end-to-end real-time dashboard updates via Postgres LISTEN/NOTIFY triggers, NestJS SSE stream endpoint, Next.js SSE proxy, and Redis Cache-Aside clinic index with Postgres fallback.  
**SuggestedCommitMessage:** feat: implement real-time SSE stream and Redis cache-aside dashboard pipeline | System Architecture

### 🧠 Logic & Decisions

- **The Why:** Per design doc steps 9 & 10, real-time dashboard status transitions and high-speed clinic listing require decoupling notification delivery from heavy data payloads and providing cache-aside O(1) reads with zero data loss.
  - **Postgres Notify + Fetch (Step 9):** To respect Postgres's 8KB payload ceiling, `002-referral-notify.sql` fires a lightweight channel notification carrying only `id`, `clinic_id`, and `status`. `PostgresListenService` receives the event and streams it into NestJS `@Sse('referrals/stream')` with tenant isolation (`filter(notification.clinicId === clinicId)`). The service then fetches the full `ReferralView` read model from Postgres / Redis cache before pushing the `referral-changed` SSE event down to the client.
  - **Next.js SSE Route Proxy:** Added `apps/web/src/app/api/referrals/stream/route.ts` to proxy the EventSource connection from the browser to `workbench-api`, attaching HTTP-only session JWT cookies server-side.
  - **Client-Side Real-Time Reconciliation:** Built `useReferralStatusStream` hook and `referral-view.manager.ts` to seamlessly update the dashboard table on status changes (`AWAITING_UPLOAD` → `PROCESSING` → `COMPLETED` / `FAILED` / `REJECTED`) without requiring manual page refreshes.
  - **Redis Secondary Index & Cache-Aside (Step 10):** Implemented `clinic:{id}:referrals` Set index and `referral_view:{id}` hashes in `RedisService`. `ApplicationService.listReferralViewsByClinic` resolves clinic views cache-aside and gracefully falls back to Postgres on cold start, eviction, or partial cache miss, backfilling Redis tolerantly without breaking request execution.
  - **Agent Worker & Model Choice Hardening:** Made `GEMINI_MODEL` strictly sourced from `.env` in `apps/agent_worker/src/config/env.config.ts` (configured to `gemini-2.0-flash`), tuned poll timeout, and removed deleted mock files.
- **State Change:** The dashboard now displays live referral lifecycle updates in real time via SSE without polling, and clinic referral listings are served in O(1) from Redis with full Postgres read fallback.

### 🔗 Dependencies

- **Modified:** `apps/workbench-api/src/application/application.service.ts`, `apps/workbench-api/src/application/ports/caching.port.ts`, `apps/workbench-api/src/application/ports/referral-repository.port.ts`, `apps/workbench-api/src/application/read-models/referral-view.read-model.ts`, `apps/workbench-api/src/infrastructure/caching/redis.service.ts`, `apps/workbench-api/src/infrastructure/notifications/postgres-listen.service.ts`, `apps/workbench-api/src/interface/http/clinics/clinics.controller.ts`, `apps/workbench-api/src/interface/http/dto/index.dto.ts`, `docker/postgres/init/002-referral-notify.sql`, `apps/web/src/app/api/referrals/stream/route.ts`, `apps/web/src/hooks/use-referral-status-stream.ts`, `apps/web/src/managers/referral-view.manager.ts`, `apps/web/src/apps/dashboard/index.tsx`, `apps/web/src/features/referrals/**`, `apps/agent_worker/src/**`, `.env.example`, `.gitignore`
- **Impact:** Requires Postgres trigger `002-referral-notify.sql` loaded in database (handled on compose boot / migration); Next.js dashboard opens an SSE stream to `/api/referrals/stream`; Redis cache failures now log warnings and degrade to Postgres without throwing 500s.
