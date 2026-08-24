---
trigger: always_on
languages_supported:
  - Go
  - TypeScript
  - Python
rule_classification: 100% Generic (Language-Agnostic Commit & Logging Workflow)
---

# AI Context Log & Commit Rules `[Generic - All Languages]`

* **Languages Supported:** Go, TypeScript, Python
* **Classification:** `[Generic Process Rule]`

> **SYSTEM INSTRUCTION:**  
> This document acts as the project's persistent memory.  
> **BEFORE** generating a Git commit, the AI Agent **MUST** append a new entry to `docs/commit-log.md` using the provided Schema.  
> **CRITICAL RULE:** All new log entries MUST be appended to the **VERY BOTTOM** of `docs/commit-log.md`.  
> **CRITICAL RULE:** Existing/previous commit log entries MUST NEVER be altered, overwritten, or deleted.



---

## 1. Context Log Schema

The Agent must use the following template for every entry.
```markdown
## [Version/Tag] | [YYYY-MM-DD] | [Type]

**Category:** [CHANGES_CATEGORY]  
**Summary:** [Concise 1-sentence summary of the change]  
**SuggestedCommitMessage:** [COMMIT_TYPE]: [COMMIT_DESCRIPTION] | [CHANGES_CATEGORY]

### 🧠 Logic & Decisions

- **The Why:** [Explain architectural reasoning. Why this pattern? Why this library?]
- **State Change:** [Global system behavior changes. e.g., "Auth middleware is now strict by default"]

### 🔗 Dependencies

- **Modified:** [List key files changed]
- **Impact:** [List modules that might break, need updates, or require regression testing]
```

---

## 2. Validation Rules

### A. Allowed [COMMIT_TYPE]

(Choose one of the following for the [COMMIT_TYPE] slot)

- **feat** - A new feature
- **fix** - A bug fix
- **docs** - Documentation only changes
- **style** - Markup, white-space, formatting, missing semicolons
- **refactor** - A code change that neither fixes a bug nor adds a feature
- **perf** - A code change that improves performance
- **test** - Adding missing tests
- **build** - Build related changes
- **ci** - CI related changes
- **chore** - Build process or auxiliary tool changes
- **revert** - Reverting a previous commit

### B. Allowed [CHANGES_CATEGORY]

(Choose one of the following for the [CHANGES_CATEGORY] slot. If none fit, create a new one.)

- AI Rules
- System Foundation
- System Architecture
- Domain Models
- Application Services
- Infrastructure Services
- Interface Services

### C. Version Increment Rules (`v[MAJOR].[MINOR].[PATCH]`)

- **Rightmost Number (`PATCH` - e.g. `v0.0.X`):** MUST be incremented with **EACH AND EVERY COMMIT LOG ENTRY**. No two commits may ever share the same version number!
- **Middle Number (`MINOR` - e.g. `v0.X.0`):** Incremented with each new working complete version (resets `PATCH` to `0`).
- **First/Leftmost Number (`MAJOR` - e.g. `vX.0.0`):** Incremented with each complete development cycle / major feature milestone on demand (resets `MINOR` and `PATCH` to `0`).


---

## 3. Log Entries

> **IMPORTANT:**  
> All log entries must be appended to the file: `docs/commit-log.md`  
> This file serves as the centralized commit history and decision log for the antigravity project.

*(Agent: Append new entries below this line in `docs/commit-log.md`)*

---