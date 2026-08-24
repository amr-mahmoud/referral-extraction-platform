# Agent Instructions & Operating Rules

## Pre-Commit Logging Rules

1. **Pre-Commit Log Trigger:** Whenever preparing or executing a Git commit, the agent MUST log the changes to `docs/commit-log.md` following the schema defined in `.agent/rules/pre-commit-log-instructions.md`.
2. **Append to Bottom:** All new context log entries MUST be appended to the **VERY BOTTOM** of `docs/commit-log.md` in chronological order.
3. **Immutability:** Existing and previous commit entries in `docs/commit-log.md` MUST NOT be modified, re-ordered, or deleted under any circumstances. Previous log entries are strictly read-only.
4. **Strict Version Incrementing (`v[MAJOR].[MINOR].[PATCH]`):**
   - **Rightmost (`PATCH`):** Increments with **EVERY** commit (no two commits share the same version).
   - **Middle (`MINOR`):** Increments with each working new complete version (resets `PATCH` to `0`).
   - **First (`MAJOR`):** Increments with each complete development cycle / major feature release on demand (resets `MINOR` and `PATCH` to `0`).

