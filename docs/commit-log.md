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
