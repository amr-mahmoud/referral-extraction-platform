# ==============================================================================
# Plena Referral Extraction Platform - Monorepo Makefile
# ==============================================================================
# This Makefile provides organized management targets for developing, building,
# running, and stopping all three applications in the monorepo:
#   1. web           - Next.js Web Review Interface (apps/web)
#   2. workbench-api - NestJS Workbench API Backend (apps/workbench-api)
#   3. agent_worker  - Node.js + TypeScript SQS Worker (apps/agent_worker)
# ==============================================================================

.PHONY: help install dev dev-web dev-api dev-worker build build-web build-api build-worker kill stop kill-all lint clean

# Default target when running 'make'
.DEFAULT_GOAL := help

# ------------------------------------------------------------------------------
# 1. HELP & DISCOVERY
# ------------------------------------------------------------------------------
help: ## Display available Makefile commands and usage
	@echo ""
	@echo "Plena Referral Extraction Platform - Commands:"
	@echo "--------------------------------------------------------"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?##/ {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""

# ------------------------------------------------------------------------------
# 2. DEPENDENCY INSTALLATION
# ------------------------------------------------------------------------------
install: ## Install all dependencies across all monorepo workspaces
	@echo "--> Installing dependencies for all monorepo apps..."
	npm install

# ------------------------------------------------------------------------------
# 3. DEVELOPMENT RUNNERS (LOCAL MODE)
# ------------------------------------------------------------------------------
dev: ## Run ALL 3 applications concurrently in local development mode
	@echo "--> Starting Web, Workbench API, and Agent Worker simultaneously..."
	npm run dev

dev-web: ## Run ONLY the Next.js Web App in development mode (apps/web)
	@echo "--> Starting Next.js Web App (apps/web)..."
	npm run dev:web

dev-api: ## Run ONLY the NestJS Workbench API in development mode (apps/workbench-api)
	@echo "--> Starting NestJS Workbench API (apps/workbench-api)..."
	npm run dev:api

dev-worker: ## Run ONLY the Node.js Agent Worker in development mode (apps/agent_worker)
	@echo "--> Starting Agent Worker (apps/agent_worker)..."
	npm run dev:worker

# ------------------------------------------------------------------------------
# 4. PROCESS MANAGEMENT & KILL TARGETS
# ------------------------------------------------------------------------------
kill: ## Kill all running local development processes for web, api, and worker apps
	@echo "--> Stopping all local development processes..."
	@-pkill -f "apps/web" 2>/dev/null || true
	@-pkill -f "apps/workbench-api" 2>/dev/null || true
	@-pkill -f "apps/agent_worker" 2>/dev/null || true
	@-pkill -f "concurrently" 2>/dev/null || true
	@-pkill -f "next-server" 2>/dev/null || true
	@-pkill -f "nest start" 2>/dev/null || true
	@-pkill -f "tsx watch" 2>/dev/null || true
	@echo "--> All local development processes stopped."

stop: kill ## Alias for 'make kill'

kill-all: kill ## Alias for 'make kill'

# ------------------------------------------------------------------------------
# 5. PRODUCTION BUILD TARGETS
# ------------------------------------------------------------------------------
build: ## Build all applications across the monorepo
	@echo "--> Building all monorepo applications..."
	npm run build

build-web: ## Build Next.js Web App for production (apps/web)
	@echo "--> Building Next.js Web App..."
	npm run build --workspace apps/web

build-api: ## Build NestJS Workbench API for production (apps/workbench-api)
	@echo "--> Building NestJS Workbench API..."
	npm run build --workspace apps/workbench-api

build-worker: ## Build Agent Worker TypeScript code (apps/agent_worker)
	@echo "--> Building Agent Worker..."
	npm run build --workspace apps/agent_worker

# ------------------------------------------------------------------------------
# 6. QUALITY & MAINTENANCE
# ------------------------------------------------------------------------------
lint: ## Run linting across all monorepo apps
	@echo "--> Linting all monorepo applications..."
	npm run lint

clean: ## Clean node_modules, .next, and dist build outputs
	@echo "--> Cleaning build artifacts and node_modules..."
	rm -rf node_modules apps/web/.next apps/web/dist apps/workbench-api/dist apps/agent_worker/dist
