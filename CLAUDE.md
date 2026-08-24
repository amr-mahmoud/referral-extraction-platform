# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Plena Referral Extraction Workbench — a system that extracts structured data from medical referral PDFs using Gemini 2.5 Flash, with a review UI for validating extracted fields against the source document (including on-click PDF bounding-box highlighting). Full design doc: `docs/product_solution_design.md` (gitignored, local-only — see Gotchas).

Target architecture (per the design doc; not yet built — see Current State below):
- **apps/web** — Next.js frontend: upload flow, side-by-side PDF review, dynamic field highlighting.
- **apps/api** (currently `apps/workbench-api`) — NestJS: clinic auth/JWT tenant isolation, S3 presigned upload URLs, SSE push of extraction results.
- **apps/worker** (currently `apps/agent_worker`) — NestJS: consumes SQS upload events, runs pre-extraction sanity checks, calls Gemini for structured extraction + bounding boxes, writes results back.
- **packages/*** — shared TS types/schemas/Prisma entities (does not exist yet).
- Data path: client → S3 (direct PUT via presigned URL) → S3 `ObjectCreated` → SQS → worker (Gemini extraction) → Postgres write + Redis cache-aside update → Postgres `LISTEN/NOTIFY` → API fetches full payload by PK → pushed to client over SSE.
- Postgres (via Prisma) is system of record; Redis holds a per-clinic set of referral IDs (secondary index) for O(1) dashboard lookups, avoiding table scans.

## Current State

All three `apps/*` projects are unmodified framework scaffolds (`nest new` / `create-next-app`) with no business logic yet — no Prisma schema, no auth, no S3/SQS/Gemini integration. Expect to be building most of the design doc's flow from scratch rather than extending existing code.

## Gotchas

- **Root `package.json` workspace scripts are stale**: `dev:frontend`/`dev:api`/`dev:worker` reference `apps/frontend`, `apps/api`, `apps/worker`, but the actual directories are `apps/web`, `apps/workbench-api`, `apps/agent_worker`. These scripts will fail until either the scripts or the directory names are reconciled.
- **`apps/workbench-api` has its own nested `.git`** (from `nest new`'s auto-init) and is currently untracked at the root repo. Do not `git add` it from the root without first deciding whether to remove its inner `.git` (to fold it into this repo normally) or register it as a proper submodule — a bare `git add apps/workbench-api` from root will otherwise create a gitlink instead of tracking its files.
- **`docs/` and `.agent/` are gitignored** at the repo root (see `.gitignore`), so the product design doc and agent rule files exist locally but will not be committed or visible in a fresh clone.

## Commands

Run from repo root unless noted. Root workspaces are `apps/*` (npm workspaces).

```bash
npm install                       # install all workspaces (root)

# apps/web (Next.js)
npm run dev --workspace apps/web        # dev server
npm run build --workspace apps/web
npm run lint --workspace apps/web

# apps/workbench-api and apps/agent_worker (NestJS) — same script set in both
npm run start:dev --workspace apps/workbench-api   # watch mode
npm run build --workspace apps/workbench-api
npm run lint --workspace apps/workbench-api         # eslint --fix
npm run test --workspace apps/workbench-api         # jest unit tests
npm run test:e2e --workspace apps/workbench-api     # jest e2e (test/jest-e2e.json)
npm run test:cov --workspace apps/workbench-api

# single test file (from within the app's directory, e.g. apps/workbench-api)
npx jest src/app.controller.spec.ts

# whole-monorepo build/lint (root package.json)
npm run build   # runs build in every workspace that has the script
npm run lint    # runs lint in every workspace that has the script
```

Jest config for both Nest apps runs with `rootDir: src` and matches `*.spec.ts`; e2e tests live under `test/` with a separate `jest-e2e.json` config.

## Architecture Rules (apply to the NestJS apps)

These come from `.agent/rules/` (always-on agent rules for this repo) and apply to `apps/workbench-api` and `apps/agent_worker`.

**DDD data-update flow** — for any write/update operation, follow this order strictly (do not skip steps for convenience):
1. Fetch the full aggregate root from a Repository Port (never construct a bare "shell" object like `Account.forUpdate(id)` just to satisfy an ORM call).
2. Construct any nested Value Objects/Entities from the incoming DTO first.
3. Mutate the aggregate through an explicit domain method (e.g. `aggregate.updateProfile(...)`) so domain invariants are checked against current state — never add narrow repository methods like `updateUserBio(id, bio)` that bypass the domain.
4. Persist by passing the mutated aggregate back to the repository; let the infrastructure layer figure out what changed.

**Commit logging** — before generating a git commit, append an entry to `docs/commit-log.md` using the schema in `.agent/rules/pre-commit-log-instructions.md` (version/date/type header, Category, Summary, SuggestedCommitMessage, Logic & Decisions, Dependencies). Commit type must be one of: feat/fix/docs/style/refactor/perf/test/build/ci/chore/revert. All new log entries MUST be appended to the **very bottom** of `docs/commit-log.md` in chronological order; previous commit log entries MUST NEVER be altered, re-ordered, or deleted. Each commit entry MUST increment the version string `v[MAJOR].[MINOR].[PATCH]` (rightmost PATCH increments on EVERY commit so no two commits share the same version; middle MINOR increments per complete working version; leftmost MAJOR increments per development cycle on demand).


