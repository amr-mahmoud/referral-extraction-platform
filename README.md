# Plena Referral Extraction Platform

A high-throughput, scalable medical referral extraction workbench built as a TypeScript monorepo. It automatically processes medical referral PDFs using Gemini 2.5 Flash, extracts structured clinical payloads with dynamic bounding-box spatial grounding, and streams real-time status updates to a Next.js review interface.

---

## 🚀 Monorepo Apps & Local Ports Summary

| Application | Path | Technology | Mode | Local URL / Binding | Description |
|---|---|---|---|---|---|
| **Web Interface** | `apps/web` | Next.js 16 (App Router) | Frontend UI | `http://localhost:3000` | Review interface for uploading referral PDFs, viewing structured output, and interactive spatial bounding-box highlighting. |
| **Workbench API** | `apps/workbench-api` | NestJS | REST API & SSE Server | `http://localhost:8001` | Handles clinic auth (JWT), tenant isolation, extraction schemas, presigned S3 upload URLs, and SSE status streaming. |
| **Agent Worker** | `apps/agent_worker` | Node.js + TypeScript | Background Worker Daemon | **No inbound HTTP port** *(Background SQS Daemon)* | Asynchronous worker long-polling AWS SQS for uploads, fetching PDFs from S3, calling Gemini 2.5 Flash, and updating Postgres/Redis. *(Optional health check at `http://localhost:8002/health`)* |

---

## 🛠️ Getting Started (Local Development)

### Prerequisites
- Node.js >= 20
- npm >= 10

### 1. Install Dependencies
Install all workspace dependencies across the monorepo with a single command:
```bash
make install
# OR
npm install
```

### 2. Run All Applications Concurrently
To start **Next.js Web**, **Workbench API**, and **Agent Worker** simultaneously in local mode:
```bash
make dev
# OR
npm run dev
```

### 3. Stop All Local Applications
To stop all running background/foreground development processes:
```bash
make stop
# OR
make kill
```

---

## 📜 Makefile Command Palette

Run `make` or `make help` to inspect available Makefile targets:

```bash
Plena Referral Extraction Platform - Commands:
--------------------------------------------------------
  help               Display available Makefile commands and usage
  install            Install all dependencies across all monorepo workspaces
  dev                Run ALL 3 applications concurrently in local development mode
  dev-web            Run ONLY the Next.js Web App in development mode (apps/web)
  dev-api            Run ONLY the NestJS Workbench API in development mode (apps/workbench-api)
  dev-worker         Run ONLY the Node.js Agent Worker in development mode (apps/agent_worker)
  kill               Kill all running local development processes for web, api, and worker apps
  stop               Alias for 'make kill'
  build              Build all applications across the monorepo
  build-web          Build Next.js Web App for production (apps/web)
  build-api          Build NestJS Workbench API for production (apps/workbench-api)
  build-worker       Build Agent Worker TypeScript code (apps/agent_worker)
  lint               Run linting across all monorepo apps
  clean              Clean node_modules, .next, and dist build outputs
```

---

## 🏗️ Repository Architecture & Topology

```text
referral-extraction-platform/
├── apps/
│   ├── web/              # Next.js 16 Web Review Interface (Frontend)
│   ├── workbench-api/    # NestJS Workbench API & SSE Server (Backend)
│   └── agent_worker/     # Node.js + TypeScript Async SQS Queue Consumer (Worker)
├── docs/
│   ├── commit-log.md     # Centralized pre-commit decision log
│   └── product_solution_design.md
├── Makefile              # Unified developer command palette
└── package.json          # Root npm workspace configuration
```